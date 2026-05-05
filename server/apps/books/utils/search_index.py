from __future__ import annotations

from typing import TYPE_CHECKING

from apps.books.models import Book, BookSearchIndex

if TYPE_CHECKING:
    from collections.abc import Iterable

TITLE_WEIGHT = 4
AUTHOR_WEIGHT = 3
GENRE_WEIGHT = 2
ISBN_WEIGHT = 4


def _clean_text(value: object) -> str:
    if value is None:
        return ""

    return " ".join(str(value).split())


def _join_unique(values: Iterable[object]) -> str:
    seen = set()
    cleaned_values = []

    for value in values:
        cleaned = _clean_text(value)
        key = cleaned.casefold()
        if not cleaned or key in seen:
            continue

        seen.add(key)
        cleaned_values.append(cleaned)

    return " ".join(cleaned_values)


def _weighted_document(*, title: str, authors: str, genres: str, isbn: str, description: str) -> str:
    parts = (
        [title] * TITLE_WEIGHT
        + [isbn] * ISBN_WEIGHT
        + [authors] * AUTHOR_WEIGHT
        + [genres] * GENRE_WEIGHT
        + [description]
    )
    return " ".join(part for part in parts if part)


def build_book_search_payload(book: Book) -> dict[str, str]:
    title = _clean_text(book.title)
    authors = _join_unique(author.name for author in book.authors.all())
    genres = _join_unique(genre.name for genre in book.genres.all())
    isbn = _join_unique([book.isbn13, book.isbn])
    description = _clean_text(book.description)

    return {
        "title": title,
        "authors": authors,
        "genres": genres,
        "isbn": isbn,
        "description": description,
        "document": _weighted_document(
            title=title,
            authors=authors,
            genres=genres,
            isbn=isbn,
            description=description,
        ),
    }


def sync_book_search_index(book_id: str) -> BookSearchIndex | None:
    book = Book.objects.prefetch_related("authors", "genres").filter(pk=book_id).first()
    if not book:
        return None

    search_index, _created = BookSearchIndex.objects.update_or_create(
        book=book,
        defaults=build_book_search_payload(book),
    )
    return search_index


def rebuild_book_search_index(batch_size: int = 500) -> int:
    count = 0
    queryset = Book.objects.prefetch_related("authors", "genres").order_by("isbn13")

    for book in queryset.iterator(chunk_size=batch_size):
        sync_book_search_index(book.isbn13)
        count += 1

    return count
