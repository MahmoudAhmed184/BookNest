from __future__ import annotations

import hashlib
import logging
from datetime import date
from time import perf_counter
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.db import models, transaction
from django.db.models import Case, IntegerField, Q, Value, When
from django.utils import timezone

from apps.books import selectors as book_selectors
from apps.books.models import Author, Book, Genre
from apps.books.services import sync_book_denormalized_labels
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog

logger = logging.getLogger(__name__)

DEFAULT_SEARCH_PAGE_SIZE = 20
MAX_SEARCH_PAGE_SIZE = 100
EXTERNAL_ENRICHMENT_CACHE_SECONDS = 60 * 60 * 6
SEARCH_ORDERINGS = {
    "relevance",
    "trending",
    "popular",
    "rating",
    "newest",
    "title",
}


def normalize_query(query: str) -> str:
    return " ".join(query.casefold().strip().split())


def _list_filter(value: Any) -> list[str]:
    if value is None:
        return []
    values = value.split(",") if isinstance(value, str) else value
    return [str(item).strip() for item in values if str(item).strip()]


def _int_list_filter(value: Any) -> list[int]:
    ids = []
    for item in _list_filter(value):
        try:
            ids.append(int(item))
        except ValueError:
            continue
    return ids


def _safe_bool(value: Any, *, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).casefold() in {"1", "true", "yes", "on"}


def _apply_book_filters(queryset, filters: dict[str, Any]):
    genre_ids = _int_list_filter(filters.get("genre_ids"))
    genre_names = _list_filter(filters.get("genres"))
    author_ids = _int_list_filter(filters.get("author_ids"))
    author_names = _list_filter(filters.get("authors"))
    languages = _list_filter(filters.get("languages"))
    sources = _list_filter(filters.get("sources"))

    if genre_ids:
        queryset = queryset.filter(book_genres__genre_id__in=genre_ids)
    if genre_names:
        queryset = queryset.filter(book_genres__genre__name__in=genre_names)
    if author_ids:
        queryset = queryset.filter(book_authors__author_id__in=author_ids)
    if author_names:
        queryset = queryset.filter(book_authors__author__name__in=author_names)
    if languages:
        queryset = queryset.filter(language__in=languages)
    if sources:
        queryset = queryset.filter(source__in=sources)

    min_rating = filters.get("min_rating")
    if min_rating not in (None, ""):
        queryset = queryset.filter(average_rating__gte=min_rating)
    max_rating = filters.get("max_rating")
    if max_rating not in (None, ""):
        queryset = queryset.filter(average_rating__lte=max_rating)

    pub_date_from = filters.get("pub_date_from")
    if pub_date_from:
        queryset = queryset.filter(publication_date__gte=pub_date_from)
    pub_date_to = filters.get("pub_date_to")
    if pub_date_to:
        queryset = queryset.filter(publication_date__lte=pub_date_to)

    publication_year_from = filters.get("publication_year_from")
    if publication_year_from not in (None, ""):
        queryset = queryset.filter(publication_year__gte=publication_year_from)
    publication_year_to = filters.get("publication_year_to")
    if publication_year_to not in (None, ""):
        queryset = queryset.filter(publication_year__lte=publication_year_to)

    page_count_min = filters.get("page_count_min") or filters.get("num_pages")
    if page_count_min not in (None, ""):
        queryset = queryset.filter(page_count__gte=page_count_min)
    page_count_max = filters.get("page_count_max")
    if page_count_max not in (None, ""):
        queryset = queryset.filter(page_count__lte=page_count_max)

    if "is_featured" in filters:
        queryset = queryset.filter(is_featured=_safe_bool(filters.get("is_featured")))

    return queryset


def _apply_search_ordering(queryset, *, query: str, ordering: str):
    ordering = ordering if ordering in SEARCH_ORDERINGS else "relevance"
    if ordering == "title":
        return queryset.order_by("title", "id")
    if ordering == "newest":
        return queryset.order_by("-publication_year", "-publication_date", "title", "id")
    if ordering == "rating":
        return queryset.order_by("-average_rating", "-rating_count", "title", "id")
    if ordering == "popular":
        return queryset.order_by("-popularity_score", "-rating_count", "title", "id")
    if ordering == "trending":
        return queryset.order_by("-trending_score", "-popularity_score", "title", "id")

    if query:
        return queryset.annotate(
            isbn_priority=Case(
                When(isbn_13__iexact=query, then=Value(4)),
                When(isbn_10__iexact=query, then=Value(4)),
                When(isbn_13__istartswith=query, then=Value(3)),
                When(isbn_10__istartswith=query, then=Value(3)),
                When(isbn_13__icontains=query, then=Value(2)),
                When(isbn_10__icontains=query, then=Value(2)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            title_priority=Case(
                When(title__iexact=query, then=Value(4)),
                When(title__istartswith=query, then=Value(3)),
                When(title__icontains=query, then=Value(2)),
                When(subtitle__icontains=query, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            author_priority=Case(
                When(author_names__icontains=query, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            genre_priority=Case(
                When(genre_labels__icontains=query, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
        ).order_by(
            "-isbn_priority",
            "-title_priority",
            "-author_priority",
            "-genre_priority",
            "-trending_score",
            "-popularity_score",
            "-average_rating",
            "title",
            "id",
        )

    return queryset.order_by("-trending_score", "-popularity_score", "-average_rating", "title", "id")


def user_allows_external_enrichment(*, user: Any | None) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return True
    try:
        return bool(user.preferences.external_enrichment_enabled)
    except AttributeError:
        return True


def queue_external_enrichment_if_needed(
    *,
    query: str,
    user: Any | None,
    result_count: int,
    include_external: bool,
    page_size: int = DEFAULT_SEARCH_PAGE_SIZE,
) -> bool:
    query = query.strip()
    if result_count or not include_external or len(query) < 3 or not user_allows_external_enrichment(user=user):
        return False

    cache_key = (
        f"{settings.CACHE_KEY_PREFIX}:external_search_enqueued:"
        f"{hashlib.md5(query.casefold().encode(), usedforsecurity=False).hexdigest()}"
    )
    if not cache.add(cache_key, True, timeout=EXTERNAL_ENRICHMENT_CACHE_SECONDS):
        return False

    try:
        from apps.integrations.services import create_external_enrichment_request
        from apps.integrations.tasks import enqueue_external_enrichment_request

        request = create_external_enrichment_request(
            query=query,
            requested_by=user if getattr(user, "is_authenticated", False) else None,
            priority=5,
        )
        enqueue_external_enrichment_request(request=request, page_size=min(max(int(page_size), 1), 40))
        return True
    except Exception as exc:
        cache.delete(cache_key)
        logger.warning("Could not queue external enrichment for search '%s': %s", query, exc)
        return False


def search_books(
    *,
    query: str,
    user: Any | None = None,
    filters: dict[str, Any] | None = None,
    ordering: str = "relevance",
    include_external: bool = False,
    page_size: int = DEFAULT_SEARCH_PAGE_SIZE,
):
    started = perf_counter()
    normalized_query = normalize_query(query)
    filters = filters or {}
    queryset = book_selectors.book_search_queryset(
        query=normalized_query,
        include_adult=_safe_bool(filters.get("include_adult")),
    )
    queryset = _apply_book_filters(queryset, filters)
    queryset = _apply_search_ordering(queryset, query=normalized_query, ordering=ordering).distinct()
    result_count = queryset.count()
    enrichment_requested = queue_external_enrichment_if_needed(
        query=normalized_query,
        user=user,
        result_count=result_count,
        include_external=include_external,
        page_size=page_size,
    )
    SearchQueryLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        query=query,
        normalized_query=normalized_query,
        filters=filters or {},
        sort=ordering,
        page_size=page_size,
        result_count=result_count,
        external_enrichment_requested=enrichment_requested,
        response_ms=int((perf_counter() - started) * 1000),
    )
    return queryset


def search_suggestions(*, query: str, limit: int = 10, term_type: str | None = None) -> list[SearchAutocompleteTerm]:
    normalized_query = normalize_query(query)
    if not normalized_query:
        return []
    limit = min(max(int(limit), 1), 50)
    queryset = SearchAutocompleteTerm.objects.filter(
        normalized_term__startswith=normalized_query,
        is_active=True,
    )
    if term_type:
        queryset = queryset.filter(term_type=term_type)
    suggestions = list(queryset.order_by("-weight", "term")[:limit])
    if len(suggestions) < limit:
        suggestions.extend(
            _live_autocomplete_suggestions(
                query=query,
                limit=limit - len(suggestions),
                term_type=term_type,
                exclude={(suggestion.term_type, suggestion.term) for suggestion in suggestions},
            )
        )
    if suggestions:
        SearchAutocompleteTerm.objects.filter(id__in=[term.id for term in suggestions]).update(
            use_count=models.F("use_count") + 1,
            last_seen_at=timezone.now(),
        )
    SearchQueryLog.objects.create(
        query=query,
        normalized_query=normalized_query,
        result_count=len(suggestions),
        source=SearchQueryLog.Source.AUTOCOMPLETE,
        page_size=limit,
        response_ms=0,
    )
    return suggestions


def _autocomplete_term(
    *,
    term: str,
    term_type: str,
    target: Book | Author | Genre,
    weight: int,
) -> SearchAutocompleteTerm:
    autocomplete_term, _ = SearchAutocompleteTerm.objects.update_or_create(
        term=term,
        term_type=term_type,
        defaults={
            "target": target,
            "is_active": True,
            "last_seen_at": timezone.now(),
            "weight": max(int(weight), 0),
        },
    )
    autocomplete_term.refresh_from_db()
    return autocomplete_term


def _live_autocomplete_suggestions(
    *,
    query: str,
    limit: int,
    term_type: str | None,
    exclude: set[tuple[str, str]],
) -> list[SearchAutocompleteTerm]:
    if limit <= 0:
        return []

    normalized_query = normalize_query(query)
    isbn_query = normalized_query.replace("-", "").replace(" ", "")
    suggestions: list[SearchAutocompleteTerm] = []
    seen = set(exclude)

    def can_add(candidate_type: str) -> bool:
        return term_type in (None, candidate_type) and len(suggestions) < limit

    def add(term: str, candidate_type: str, target: Book | Author | Genre, weight: int) -> None:
        if not term or not can_add(candidate_type):
            return
        key = (candidate_type, term)
        if key in seen:
            return
        suggestions.append(_autocomplete_term(term=term, term_type=candidate_type, target=target, weight=weight))
        seen.add(key)

    if can_add(SearchAutocompleteTerm.TermType.BOOK):
        books = (
            Book.objects.visible()
            .filter(title__icontains=normalized_query)
            .only("id", "title", "rating_count")
            .order_by("-rating_count", "title", "id")[:limit]
        )
        for book in books:
            add(book.title, SearchAutocompleteTerm.TermType.BOOK, book, book.rating_count)

    if isbn_query and can_add(SearchAutocompleteTerm.TermType.ISBN):
        books = (
            Book.objects.visible()
            .filter(Q(isbn_13__startswith=isbn_query) | Q(isbn_10__startswith=isbn_query))
            .only("id", "isbn_13", "isbn_10", "rating_count")
            .order_by("-rating_count", "title", "id")[:limit]
        )
        for book in books:
            if book.isbn_13 and book.isbn_13.startswith(isbn_query):
                add(book.isbn_13, SearchAutocompleteTerm.TermType.ISBN, book, book.rating_count)
            if book.isbn_10 and book.isbn_10.startswith(isbn_query):
                add(book.isbn_10, SearchAutocompleteTerm.TermType.ISBN, book, book.rating_count)

    if can_add(SearchAutocompleteTerm.TermType.AUTHOR):
        authors = (
            Author.objects.filter(is_active=True)
            .filter(Q(name__icontains=normalized_query) | Q(normalized_name__icontains=normalized_query))
            .only("id", "name", "books_count")
            .order_by("-books_count", "name", "id")[:limit]
        )
        for author in authors:
            add(author.name, SearchAutocompleteTerm.TermType.AUTHOR, author, author.books_count)

    if can_add(SearchAutocompleteTerm.TermType.GENRE):
        genres = (
            Genre.objects.filter(Q(name__icontains=normalized_query) | Q(normalized_name__icontains=normalized_query))
            .only("id", "name", "books_count")
            .order_by("-books_count", "name", "id")[:limit]
        )
        for genre in genres:
            add(genre.name, SearchAutocompleteTerm.TermType.GENRE, genre, genre.books_count)

    return suggestions


def related_book_suggestions(*, book: Book, limit: int = 10):
    limit = min(max(int(limit), 1), 50)
    genre_ids = list(book.book_genres.values_list("genre_id", flat=True))
    author_ids = list(book.book_authors.values_list("author_id", flat=True))
    queryset = Book.objects.visible().exclude(pk=book.pk)
    if author_ids or genre_ids:
        queryset = queryset.filter(Q(book_authors__author_id__in=author_ids) | Q(book_genres__genre_id__in=genre_ids))
    return (
        queryset.annotate(
            same_author=Case(
                When(book_authors__author_id__in=author_ids, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            same_genre=Case(
                When(book_genres__genre_id__in=genre_ids, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
        )
        .distinct()
        .order_by("-same_author", "-same_genre", "-trending_score", "-average_rating", "title", "id")[:limit]
    )


def parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


@transaction.atomic
def rebuild_autocomplete_terms() -> int:
    SearchAutocompleteTerm.objects.update(is_active=False)
    count = 0
    for book in Book.objects.filter(is_public=True, is_archived=False).only("id", "title", "isbn_13", "isbn_10"):
        SearchAutocompleteTerm.objects.update_or_create(
            term=book.title,
            term_type=SearchAutocompleteTerm.TermType.BOOK,
            defaults={"target": book, "is_active": True, "last_seen_at": timezone.now(), "weight": book.rating_count},
        )
        count += 1
        for isbn in (book.isbn_13, book.isbn_10):
            if isbn:
                SearchAutocompleteTerm.objects.update_or_create(
                    term=isbn,
                    term_type=SearchAutocompleteTerm.TermType.ISBN,
                    defaults={
                        "target": book,
                        "is_active": True,
                        "last_seen_at": timezone.now(),
                        "weight": book.rating_count,
                    },
                )
                count += 1
    for author in Author.objects.filter(is_active=True).only("id", "name", "books_count"):
        SearchAutocompleteTerm.objects.update_or_create(
            term=author.name,
            term_type=SearchAutocompleteTerm.TermType.AUTHOR,
            defaults={
                "target": author,
                "is_active": True,
                "last_seen_at": timezone.now(),
                "weight": author.books_count,
            },
        )
        count += 1
    for genre in Genre.objects.only("id", "name", "books_count"):
        SearchAutocompleteTerm.objects.update_or_create(
            term=genre.name,
            term_type=SearchAutocompleteTerm.TermType.GENRE,
            defaults={"target": genre, "is_active": True, "last_seen_at": timezone.now(), "weight": genre.books_count},
        )
        count += 1
    return count


def rebuild_book_search_labels() -> int:
    count = 0
    for book in Book.objects.prefetch_related("book_authors__author", "book_genres__genre").iterator():
        sync_book_denormalized_labels(book=book)
        count += 1
    SearchIndexStatus.objects.update_or_create(
        name=SearchIndexStatus.IndexName.BOOKS,
        defaults={
            "status": SearchIndexStatus.Status.READY,
            "last_rebuilt_at": timezone.now(),
            "document_count": count,
            "error_message": "",
        },
    )
    return count
