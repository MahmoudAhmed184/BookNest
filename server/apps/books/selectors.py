from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.books.models import Author, Book, Genre, RelatedBook

if TYPE_CHECKING:
    from django.db.models import QuerySet


BOOK_ORDERINGS = {
    "trending": ("-trending_score", "-popularity_score", "title", "id"),
    "popular": ("-popularity_score", "-rating_count", "title", "id"),
    "rating": ("-average_rating", "-rating_count", "title", "id"),
    "newest": ("-publication_year", "-publication_date", "title", "id"),
    "title": ("title", "id"),
    "featured": ("-is_featured", "featured_rank", "title", "id"),
}

AUTHOR_ORDERINGS = {
    "name": ("name", "id"),
    "books": ("-books_count", "name", "id"),
    "likes": ("-like_count", "name", "id"),
    "newest": ("-created_at", "-id"),
}

GENRE_ORDERINGS = {
    "name": ("name", "id"),
    "books": ("-books_count", "name", "id"),
    "featured": ("-is_featured", "carousel_rank", "name", "id"),
    "newest": ("-created_at", "-id"),
}


def _list_filter(value: Any) -> list[str]:
    if value in (None, "", []):
        return []
    values = value.split(",") if isinstance(value, str) else value
    return [str(item).strip() for item in values if str(item).strip()]


def book_queryset(*, include_archived: bool = False) -> QuerySet[Book]:
    queryset = Book.objects.prefetch_related("authors", "genres")
    if not include_archived:
        queryset = queryset.visible()
    return queryset.order_by(*BOOK_ORDERINGS["trending"])


def book_search_queryset(*, query: str = "", include_adult: bool = False) -> QuerySet[Book]:
    queryset = book_queryset()
    if not include_adult:
        queryset = queryset.filter(is_adult=False)
    if query:
        queryset = queryset.filter(
            Q(title__icontains=query)
            | Q(subtitle__icontains=query)
            | Q(author_names__icontains=query)
            | Q(genre_labels__icontains=query)
            | Q(description__icontains=query)
            | Q(isbn_13__icontains=query)
            | Q(isbn_10__icontains=query)
        )
    return queryset.distinct().order_by(*BOOK_ORDERINGS["trending"])


def book_catalog_queryset(
    *,
    query: str = "",
    include_adult: bool = False,
    filters: dict[str, Any] | None = None,
    ordering: str = "trending",
) -> QuerySet[Book]:
    queryset = book_search_queryset(query=query, include_adult=include_adult)
    filters = filters or {}

    author_ids = _list_filter(filters.get("author_ids"))
    genre_ids = _list_filter(filters.get("genre_ids"))
    author_names = _list_filter(filters.get("authors"))
    genre_names = _list_filter(filters.get("genres"))
    languages = _list_filter(filters.get("languages"))
    sources = _list_filter(filters.get("sources"))

    if author_ids:
        queryset = queryset.filter(book_authors__author_id__in=author_ids)
    if genre_ids:
        queryset = queryset.filter(book_genres__genre_id__in=genre_ids)
    if author_names:
        queryset = queryset.filter(book_authors__author__name__in=author_names)
    if genre_names:
        queryset = queryset.filter(book_genres__genre__name__in=genre_names)
    if languages:
        queryset = queryset.filter(language__in=languages)
    if sources:
        queryset = queryset.filter(source__in=sources)
    if filters.get("min_rating") is not None:
        queryset = queryset.filter(average_rating__gte=filters["min_rating"])
    if filters.get("max_rating") is not None:
        queryset = queryset.filter(average_rating__lte=filters["max_rating"])
    if filters.get("publication_year_from") is not None:
        queryset = queryset.filter(publication_year__gte=filters["publication_year_from"])
    if filters.get("publication_year_to") is not None:
        queryset = queryset.filter(publication_year__lte=filters["publication_year_to"])
    if filters.get("page_count_min") is not None:
        queryset = queryset.filter(page_count__gte=filters["page_count_min"])
    if filters.get("page_count_max") is not None:
        queryset = queryset.filter(page_count__lte=filters["page_count_max"])
    if filters.get("is_featured") is not None:
        queryset = queryset.filter(is_featured=filters["is_featured"])
    if filters.get("is_public") is not None:
        queryset = queryset.filter(is_public=filters["is_public"])

    return queryset.distinct().order_by(*BOOK_ORDERINGS.get(ordering, BOOK_ORDERINGS["trending"]))


def get_book(*, pk: int, include_archived: bool = False) -> Book:
    return get_object_or_404(book_queryset(include_archived=include_archived), pk=pk)


def author_queryset(*, include_inactive: bool = False) -> QuerySet[Author]:
    queryset = Author.objects.all()
    if not include_inactive:
        queryset = queryset.filter(is_active=True)
    return queryset.order_by(*AUTHOR_ORDERINGS["name"])


def author_catalog_queryset(
    *,
    query: str = "",
    source: str | None = None,
    include_inactive: bool = False,
    ordering: str = "name",
) -> QuerySet[Author]:
    queryset = author_queryset(include_inactive=include_inactive)
    if query:
        queryset = queryset.filter(Q(name__icontains=query) | Q(normalized_name__icontains=query))
    if source:
        queryset = queryset.filter(source=source)
    return queryset.order_by(*AUTHOR_ORDERINGS.get(ordering, AUTHOR_ORDERINGS["name"]))


def get_author(*, pk: int) -> Author:
    return get_object_or_404(author_queryset(), pk=pk)


def genre_queryset() -> QuerySet[Genre]:
    return Genre.objects.all().order_by(*GENRE_ORDERINGS["name"])


def genre_catalog_queryset(
    *,
    query: str = "",
    parent_id: int | None = None,
    is_featured: bool | None = None,
    ordering: str = "name",
) -> QuerySet[Genre]:
    queryset = genre_queryset()
    if query:
        queryset = queryset.filter(Q(name__icontains=query) | Q(normalized_name__icontains=query))
    if parent_id is not None:
        queryset = queryset.filter(parent_id=parent_id)
    if is_featured is not None:
        queryset = queryset.filter(is_featured=is_featured)
    return queryset.order_by(*GENRE_ORDERINGS.get(ordering, GENRE_ORDERINGS["name"]))


def get_genre(*, pk: int) -> Genre:
    return get_object_or_404(genre_queryset(), pk=pk)


def books_for_author(*, author_id: int) -> QuerySet[Book]:
    return book_queryset().filter(book_authors__author_id=author_id).distinct().order_by(*BOOK_ORDERINGS["trending"])


def books_for_genre(*, genre_id: int) -> QuerySet[Book]:
    return book_queryset().filter(book_genres__genre_id=genre_id).distinct().order_by(*BOOK_ORDERINGS["trending"])


def related_books_for_book(*, book_id: int) -> QuerySet[RelatedBook]:
    return (
        RelatedBook.objects.select_related("from_book", "to_book")
        .filter(from_book_id=book_id, to_book__is_archived=False, to_book__is_public=True)
        .order_by("-score", "to_book__title", "id")
    )
