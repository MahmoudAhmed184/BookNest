from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from apps.books.models import Book, BookRating, BookReview, ReadingList

if TYPE_CHECKING:
    from apps.books.managers import BookRatingQuerySet, BookReviewQuerySet, ReadingListQuerySet  # noqa: F401


def get_book_by_isbn(*, isbn13: str) -> Book:
    try:
        return Book.objects.with_catalog_data().get(isbn13=isbn13)
    except Book.DoesNotExist as exc:
        raise ValidationError({"book": "Book does not exist"}) from exc


def sorted_reviews(
    queryset: BookReviewQuerySet, *, sort_by: str = "created_at", order: str = "desc"
) -> BookReviewQuerySet:
    if sort_by == "upvotes":
        ordering: tuple[str, ...] = (
            ("upvotes_count", "-created_at") if order == "asc" else ("-upvotes_count", "-created_at")
        )
    else:
        ordering = ("created_at",) if order == "asc" else ("-created_at",)
    return queryset.order_by(*ordering)


def review_list(*, sort_by: str = "created_at", order: str = "desc") -> BookReviewQuerySet:
    return sorted_reviews(BookReview.objects.with_related(), sort_by=sort_by, order=order)


def reviews_for_book(*, book_id: str, sort_by: str = "created_at", order: str = "desc") -> BookReviewQuerySet:
    book = get_book_by_isbn(isbn13=book_id)
    return sorted_reviews(BookReview.objects.with_related().for_book(book), sort_by=sort_by, order=order)


def ratings_for_book(*, book_id: str) -> BookRatingQuerySet:
    book = get_book_by_isbn(isbn13=book_id)
    return BookRating.objects.with_related().for_book(book).order_by("-created_at")


def reading_lists_visible_to_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().visible_to_user(user).order_by("-created_at")


def reading_lists_owned_by_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().owned_by_user(user).order_by("-created_at")


def reading_lists_for_profile_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().filter(profile__user=user).order_by("-created_at")
