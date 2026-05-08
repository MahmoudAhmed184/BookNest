from __future__ import annotations

from time import perf_counter
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.books import selectors as book_selectors
from apps.books.models import Author, Book, Genre
from apps.books.services import sync_book_denormalized_labels
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog


def normalize_query(query: str) -> str:
    return " ".join(query.casefold().strip().split())


def search_books(*, query: str, user: Any | None = None, filters: dict[str, Any] | None = None):
    started = perf_counter()
    normalized_query = normalize_query(query)
    queryset = book_selectors.book_search_queryset(query=normalized_query)
    result_count = queryset.count()
    SearchQueryLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        query=query,
        normalized_query=normalized_query,
        filters=filters or {},
        result_count=result_count,
        response_ms=int((perf_counter() - started) * 1000),
    )
    return queryset


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
