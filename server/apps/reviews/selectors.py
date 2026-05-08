from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.reviews.models import Rating, Review
from apps.users import selectors as user_selectors

if TYPE_CHECKING:
    from django.db.models import QuerySet


def rating_queryset() -> QuerySet[Rating]:
    return Rating.objects.select_related("user", "book").filter(is_archived=False)


def ratings_for_user(*, user: Any) -> QuerySet[Rating]:
    return rating_queryset().filter(user=user)


def ratings_for_target_user(*, target_user: Any, viewer: Any) -> QuerySet[Rating]:
    user_selectors.ensure_can_view_user_ratings(target_user=target_user, viewer=viewer)
    return ratings_for_user(user=target_user)


def visible_ratings_for_profile_overview(*, target_user: Any, viewer: Any) -> QuerySet[Rating]:
    if not user_selectors.can_view_user_ratings(target_user=target_user, viewer=viewer):
        return rating_queryset().none()
    return ratings_for_user(user=target_user)


def ratings_for_book(*, book_id: int) -> QuerySet[Rating]:
    return rating_queryset().filter(book_id=book_id)


def get_rating_for_user(*, rating_id: int, user: Any) -> Rating:
    return get_object_or_404(rating_queryset(), id=rating_id, user=user)


def review_queryset() -> QuerySet[Review]:
    return Review.objects.select_related("user", "book", "rating").filter(is_archived=False)


def reviews_for_user(*, user: Any) -> QuerySet[Review]:
    return review_queryset().filter(user=user)


def reviews_for_target_user(*, target_user: Any, viewer: Any) -> QuerySet[Review]:
    user_selectors.ensure_can_view_profile(target_user=target_user, viewer=viewer)
    return reviews_for_user(user=target_user)


def reviews_for_book(*, book_id: int) -> QuerySet[Review]:
    return review_queryset().filter(book_id=book_id)


def get_review_for_user(*, review_id: int, user: Any) -> Review:
    return get_object_or_404(review_queryset(), id=review_id, user=user)
