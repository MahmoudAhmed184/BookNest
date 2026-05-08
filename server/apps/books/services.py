from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction
from django.utils.text import slugify

from apps.books.models import Author, Book, BookAuthor, BookGenre, Genre

if TYPE_CHECKING:
    from collections.abc import Iterable


def normalize_label(value: str) -> str:
    return " ".join(value.casefold().strip().split())


def unique_slug(*, model, value: str, max_length: int, instance_id: int | None = None) -> str:
    base = slugify(value)[:max_length] or "item"
    slug = base
    suffix = 2
    queryset = model.objects.all()
    if instance_id is not None:
        queryset = queryset.exclude(pk=instance_id)
    while queryset.filter(slug=slug).exists():
        suffix_text = f"-{suffix}"
        slug = f"{base[: max_length - len(suffix_text)]}{suffix_text}"
        suffix += 1
    return slug


def sync_author_book_count(*, author: Author) -> None:
    author.books_count = (
        author.book_authors.filter(book__is_archived=False, book__is_public=True).values("book_id").distinct().count()
    )
    author.save(update_fields=["books_count", "updated_at"])


def sync_author_like_count(*, author: Author) -> None:
    author.like_count = author.likes.count()
    author.save(update_fields=["like_count", "updated_at"])


def sync_genre_book_count(*, genre: Genre) -> None:
    genre.books_count = (
        genre.book_genres.filter(book__is_archived=False, book__is_public=True).values("book_id").distinct().count()
    )
    genre.save(update_fields=["books_count", "updated_at"])


def sync_book_denormalized_labels(*, book: Book) -> Book:
    author_names = list(
        book.book_authors.select_related("author")
        .order_by("position", "author__name")
        .values_list("author__name", flat=True)
    )
    genre_labels = list(
        book.book_genres.select_related("genre")
        .order_by("position", "genre__name")
        .values_list("genre__name", flat=True)
    )
    book.author_names = ", ".join(author_names)
    book.genre_labels = ", ".join(genre_labels)
    book.save(update_fields=["author_names", "genre_labels", "updated_at"])
    return book


@transaction.atomic
def set_book_authors(*, book: Book, author_ids: Iterable[int]) -> Book:
    existing_authors = set(book.book_authors.values_list("author_id", flat=True))
    requested_authors = list(dict.fromkeys(author_ids))

    book.book_authors.exclude(author_id__in=requested_authors).delete()
    for position, author_id in enumerate(requested_authors):
        BookAuthor.objects.update_or_create(
            book=book,
            author_id=author_id,
            role=BookAuthor.Role.AUTHOR,
            defaults={"position": position},
        )

    for author_id in existing_authors | set(requested_authors):
        sync_author_book_count(author=Author.objects.get(pk=author_id))
    return sync_book_denormalized_labels(book=book)


@transaction.atomic
def set_book_genres(*, book: Book, genre_ids: Iterable[int]) -> Book:
    existing_genres = set(book.book_genres.values_list("genre_id", flat=True))
    requested_genres = list(dict.fromkeys(genre_ids))

    book.book_genres.exclude(genre_id__in=requested_genres).delete()
    for position, genre_id in enumerate(requested_genres):
        BookGenre.objects.update_or_create(
            book=book,
            genre_id=genre_id,
            defaults={"position": position, "is_primary": position == 0},
        )

    for genre_id in existing_genres | set(requested_genres):
        sync_genre_book_count(genre=Genre.objects.get(pk=genre_id))
    return sync_book_denormalized_labels(book=book)


@transaction.atomic
def apply_book_relationships(*, book: Book, author_ids: Iterable[int], genre_ids: Iterable[int]) -> Book:
    set_book_authors(book=book, author_ids=author_ids)
    set_book_genres(book=book, genre_ids=genre_ids)
    return book
