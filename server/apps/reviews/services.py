from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import transaction
from django.db.models import Avg, Count, Q

from apps.reviews.models import Rating, Review, ReviewVote

if TYPE_CHECKING:
    from apps.books.models import Book


def sync_book_rating_stats(*, book: Book) -> Book:
    stats = Rating.objects.filter(book=book, is_archived=False).aggregate(
        average=Avg("value"),
        count=Count("id"),
    )
    book.average_rating = stats["average"] or 0
    book.rating_count = stats["count"] or 0
    book.save(update_fields=["average_rating", "rating_count", "updated_at"])
    return book


def sync_book_review_count(*, book: Book) -> Book:
    book.review_count = Review.objects.filter(book=book, is_archived=False).count()
    book.save(update_fields=["review_count", "updated_at"])
    return book


def sync_review_vote_counts(*, review: Review) -> Review:
    counts = review.votes.aggregate(
        upvotes=Count("id", filter=Q(vote_type=ReviewVote.VoteType.UP)),
        downvotes=Count("id", filter=Q(vote_type=ReviewVote.VoteType.DOWN)),
    )
    review.upvote_count = counts["upvotes"] or 0
    review.downvote_count = counts["downvotes"] or 0
    review.score = review.upvote_count - review.downvote_count
    review.save(update_fields=["upvote_count", "downvote_count", "score", "updated_at"])
    return review


@transaction.atomic
def create_or_update_rating(*, user: Any, book: Book, value: int) -> Rating:
    rating, _created = Rating.objects.update_or_create(user=user, book=book, defaults={"value": value})
    if rating.is_archived:
        rating.is_archived = False
        rating.archived_at = None
        rating.archive_reason = ""
        rating.save()
    sync_book_rating_stats(book=book)
    return rating


@transaction.atomic
def archive_rating(*, rating: Rating, reason: str = "api_delete") -> Rating:
    rating.archive(reason=reason)
    sync_book_rating_stats(book=rating.book)
    return rating


@transaction.atomic
def create_review(*, user: Any, book: Book, **values: Any) -> Review:
    review = Review.objects.create(user=user, book=book, **values)
    sync_book_review_count(book=book)
    return review


@transaction.atomic
def archive_review(*, review: Review, reason: str = "api_delete") -> Review:
    review.archive(reason=reason)
    sync_book_review_count(book=review.book)
    return review


@transaction.atomic
def set_review_vote(*, user: Any, review: Review, vote_type: str) -> ReviewVote:
    vote, _created = ReviewVote.objects.update_or_create(user=user, review=review, defaults={"vote_type": vote_type})
    sync_review_vote_counts(review=review)
    return vote


@transaction.atomic
def delete_review_vote(*, user: Any, review: Review) -> None:
    ReviewVote.objects.filter(user=user, review=review).delete()
    sync_review_vote_counts(review=review)
