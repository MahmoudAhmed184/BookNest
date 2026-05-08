from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.books.models import Author, Book, Genre, RelatedBook

if TYPE_CHECKING:
    from django.db.models import QuerySet


def book_queryset(*, include_archived: bool = False) -> QuerySet[Book]:
    queryset = Book.objects.prefetch_related("authors", "genres")
    if not include_archived:
        queryset = queryset.visible()
    return queryset


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
    return queryset.distinct()


def get_book(*, pk: int, include_archived: bool = False) -> Book:
    return get_object_or_404(book_queryset(include_archived=include_archived), pk=pk)


def author_queryset() -> QuerySet[Author]:
    return Author.objects.filter(is_active=True)


def get_author(*, pk: int) -> Author:
    return get_object_or_404(author_queryset(), pk=pk)


def genre_queryset() -> QuerySet[Genre]:
    return Genre.objects.all()


def get_genre(*, pk: int) -> Genre:
    return get_object_or_404(genre_queryset(), pk=pk)


def books_for_author(*, author_id: int) -> QuerySet[Book]:
    return book_queryset().filter(book_authors__author_id=author_id).distinct()


def books_for_genre(*, genre_id: int) -> QuerySet[Book]:
    return book_queryset().filter(book_genres__genre_id=genre_id).distinct()


def related_books_for_book(*, book_id: int) -> QuerySet[RelatedBook]:
    return (
        RelatedBook.objects.select_related("from_book", "to_book")
        .filter(from_book_id=book_id, to_book__is_archived=False, to_book__is_public=True)
        .order_by("-score", "to_book__title")
    )
