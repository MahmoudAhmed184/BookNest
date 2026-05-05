from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.users.models import CustomUser
from apps.users.models.profile import Profile

if TYPE_CHECKING:
    from django.db.models import QuerySet


def profile_list(*, username: str | None = None, profile_type: str | None = None) -> QuerySet[Profile]:
    queryset = Profile.objects.with_related()
    if username:
        queryset = queryset.for_username(username)
    if profile_type:
        queryset = queryset.for_type(profile_type)
    return queryset


def profile_for_user(*, user: Any) -> Profile | None:
    return Profile.objects.with_related().filter(user=user).first()


def profile_exists_for_user(*, user: Any) -> bool:
    return Profile.objects.select_related("user").filter(user=user).exists()


def user_data_queryset() -> QuerySet[CustomUser]:
    return CustomUser.objects.select_related("profile").prefetch_related(
        "profile__interests",
        "profile__social_links",
        "profile__following",
        "profile__followers",
        "profile__reading_lists__reading_list_books__book__authors",
        "profile__reading_lists__reading_list_books__book__genres",
        "ratings__book__authors",
        "ratings__book__genres",
        "reviews__book__authors",
        "reviews__book__genres",
    )


def get_user_data(*, user_id: int) -> CustomUser:
    return get_object_or_404(user_data_queryset(), id=user_id)
