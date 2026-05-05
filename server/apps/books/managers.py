from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models
from django.db.models import Q

if TYPE_CHECKING:
    from apps.books.models import Book, BookRating, BookReview, ReadingList  # noqa: F401


class BookQuerySet(models.QuerySet["Book"]):
    def with_catalog_data(self) -> BookQuerySet:
        return self.prefetch_related("authors", "genres")

    def search_text(self, query: str) -> BookQuerySet:
        return self.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(authors__name__icontains=query)
            | Q(genres__name__icontains=query)
            | Q(isbn13__icontains=query)
            | Q(isbn__icontains=query)
        ).distinct()


class BookManager(models.Manager["Book"]):
    def get_queryset(self) -> BookQuerySet:
        return BookQuerySet(self.model, using=self._db)

    def with_catalog_data(self) -> BookQuerySet:
        return self.get_queryset().with_catalog_data()

    def search_text(self, query: str) -> BookQuerySet:
        return self.get_queryset().search_text(query)


class BookReviewQuerySet(models.QuerySet["BookReview"]):
    def with_related(self) -> BookReviewQuerySet:
        return self.select_related("user", "book").prefetch_related("book__authors", "book__genres")

    def for_book(self, book: Book) -> BookReviewQuerySet:
        return self.filter(book=book)

    def for_user(self, user: Any) -> BookReviewQuerySet:
        return self.filter(user=user)


class BookReviewManager(models.Manager["BookReview"]):
    def get_queryset(self) -> BookReviewQuerySet:
        return BookReviewQuerySet(self.model, using=self._db)

    def with_related(self) -> BookReviewQuerySet:
        return self.get_queryset().with_related()

    def for_book(self, book: Book) -> BookReviewQuerySet:
        return self.get_queryset().for_book(book)

    def for_user(self, user: Any) -> BookReviewQuerySet:
        return self.get_queryset().for_user(user)


class BookRatingQuerySet(models.QuerySet["BookRating"]):
    def with_related(self) -> BookRatingQuerySet:
        return self.select_related("user", "book").prefetch_related("book__authors", "book__genres")

    def for_book(self, book: Book) -> BookRatingQuerySet:
        return self.filter(book=book)

    def for_user(self, user: Any) -> BookRatingQuerySet:
        return self.filter(user=user)


class BookRatingManager(models.Manager["BookRating"]):
    def get_queryset(self) -> BookRatingQuerySet:
        return BookRatingQuerySet(self.model, using=self._db)

    def with_related(self) -> BookRatingQuerySet:
        return self.get_queryset().with_related()

    def for_book(self, book: Book) -> BookRatingQuerySet:
        return self.get_queryset().for_book(book)

    def for_user(self, user: Any) -> BookRatingQuerySet:
        return self.get_queryset().for_user(user)


class ReadingListQuerySet(models.QuerySet["ReadingList"]):
    def with_books(self) -> ReadingListQuerySet:
        return self.select_related("profile__user").prefetch_related(
            "reading_list_books__book__authors",
            "reading_list_books__book__genres",
            "books",
        )

    def visible_to_user(self, user: Any) -> ReadingListQuerySet:
        if user.is_authenticated:
            return self.filter(Q(privacy="public") | Q(profile__user=user))
        return self.filter(privacy="public")

    def owned_by_user(self, user: Any) -> ReadingListQuerySet:
        return self.filter(profile__user=user)


class ReadingListManager(models.Manager["ReadingList"]):
    def get_queryset(self) -> ReadingListQuerySet:
        return ReadingListQuerySet(self.model, using=self._db)

    def with_books(self) -> ReadingListQuerySet:
        return self.get_queryset().with_books()

    def visible_to_user(self, user: Any) -> ReadingListQuerySet:
        return self.get_queryset().visible_to_user(user)

    def owned_by_user(self, user: Any) -> ReadingListQuerySet:
        return self.get_queryset().owned_by_user(user)
