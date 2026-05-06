from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound, ValidationError

from apps.books.models import Author, Book, BookRating, BookReview, Genre, ReadingList

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from apps.books.managers import BookRatingQuerySet, BookReviewQuerySet, ReadingListQuerySet  # noqa: F401


def book_catalog_queryset() -> QuerySet[Book]:
    return Book.objects.prefetch_related("authors", "genres")


def book_resource_queryset() -> QuerySet[Book]:
    return Book.objects.all()


def author_queryset() -> QuerySet[Author]:
    return Author.objects.all()


def genre_queryset() -> QuerySet[Genre]:
    return (
        Genre.objects.annotate(book_count=Count("books", distinct=True))
        .filter(book_count__gt=0)
        .order_by("-book_count", "name")
    )


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


def review_queryset() -> BookReviewQuerySet:
    return BookReview.objects.with_related()


def rating_list() -> BookRatingQuerySet:
    return BookRating.objects.with_related().order_by("-created_at")


def reviews_for_book(*, book_id: str, sort_by: str = "created_at", order: str = "desc") -> BookReviewQuerySet:
    book = get_book_by_isbn(isbn13=book_id)
    return sorted_reviews(BookReview.objects.with_related().for_book(book), sort_by=sort_by, order=order)


def ratings_for_book(*, book_id: str) -> BookRatingQuerySet:
    book = get_book_by_isbn(isbn13=book_id)
    return BookRating.objects.with_related().for_book(book).order_by("-created_at")


def user_rating_for_book(*, user: Any, book_id: str) -> BookRating:
    book = get_book_by_isbn(isbn13=book_id)
    rating = BookRating.objects.with_related().filter(book=book, user=user).first()
    if rating is None:
        raise ValidationError({"rating": "You have not rated this book yet"})
    return rating


def ratings_for_user(*, user_id: int) -> BookRatingQuerySet:
    user = get_object_or_404(get_user_model(), id=user_id)
    return BookRating.objects.with_related().filter(user=user).order_by("-created_at")


def reviews_for_user(*, user_id: int | None) -> BookReviewQuerySet:
    user_model = get_user_model()
    try:
        user = user_model.objects.get(id=user_id)
    except user_model.DoesNotExist:
        return BookReview.objects.with_related().none()
    return BookReview.objects.with_related().filter(user=user).order_by("-created_at")


def related_books_for_book(*, book_id: str, limit: int) -> QuerySet[Book]:
    book = get_object_or_404(
        Book.objects.prefetch_related("authors", "genres"),
        pk=book_id,
    )
    author_ids = book.authors.values_list("author_id", flat=True)
    genre_ids = book.genres.values_list("id", flat=True)

    return (
        Book.objects.prefetch_related("authors", "genres")
        .filter(Q(authors__author_id__in=author_ids) | Q(genres__id__in=genre_ids))
        .exclude(isbn13=book.isbn13)
        .distinct()
        .order_by("-average_rate", "title")[:limit]
    )


def recent_reviews(*, limit: int) -> BookReviewQuerySet:
    return BookReview.objects.with_related().order_by("-created_at")[:limit]


def recent_ratings(*, limit: int) -> BookRatingQuerySet:
    return BookRating.objects.with_related().order_by("-created_at")[:limit]


def books_for_author(*, author_id: int | None = None, author_name: str | None = None) -> QuerySet[Book]:
    queryset = Book.objects.prefetch_related("authors", "genres")
    if author_id:
        return queryset.filter(authors__author_id=author_id).distinct()
    if author_name:
        return queryset.filter(authors__name__icontains=author_name).distinct()
    raise NotFound("Provide either author ID or name")


def books_for_genre(*, genre_id: int | None = None, genre_name: str | None = None) -> QuerySet[Book]:
    queryset = Book.objects.prefetch_related("authors", "genres")
    if genre_id:
        return queryset.filter(genres__id=genre_id).distinct()
    if genre_name:
        return queryset.filter(genres__name__icontains=genre_name).distinct()
    raise NotFound("Provide either genre ID or name")


def suggestion_reference_book(*, book_id: str | None = None, title: str | None = None) -> Book | None:
    queryset = Book.objects.prefetch_related("authors", "genres")
    if book_id:
        return queryset.filter(isbn13=book_id).first()
    if title:
        return queryset.filter(title__icontains=title).first()
    return None


def related_suggestion_books(*, reference_book: Book, limit: int) -> list[Book]:
    author_ids = list(reference_book.authors.values_list("author_id", flat=True))
    genre_names = list(reference_book.genres.values_list("name", flat=True))
    if not author_ids and not genre_names:
        return []

    query = Q()
    if author_ids:
        query |= Q(authors__author_id__in=author_ids)
    if genre_names:
        query |= Q(genres__name__in=genre_names)

    suggestions = (
        Book.objects.prefetch_related("authors", "genres")
        .filter(query)
        .exclude(isbn13=reference_book.isbn13)
        .distinct()
    )

    return sorted(
        suggestions,
        key=lambda book: (
            len(set(book.authors.values_list("author_id", flat=True)) & set(author_ids))
            + len(set(book.genres.values_list("name", flat=True)) & set(genre_names))
        ),
        reverse=True,
    )[:limit]


def reading_lists_visible_to_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().visible_to_user(user).order_by("-created_at")


def reading_lists_owned_by_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().owned_by_user(user).order_by("-created_at")


def reading_lists_for_profile_user(*, user: object) -> ReadingListQuerySet:
    return ReadingList.objects.with_books().filter(profile__user=user).order_by("-created_at")


def reading_lists_for_user_id(*, user_id: int) -> ReadingListQuerySet:
    user = get_object_or_404(get_user_model(), id=user_id)
    return reading_lists_owned_by_user(user=user)
