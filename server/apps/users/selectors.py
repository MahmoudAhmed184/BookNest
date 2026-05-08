from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from apps.users.models import Profile, User, UserPreference

if TYPE_CHECKING:
    from django.db.models import QuerySet


def user_queryset() -> QuerySet[User]:
    return User.objects.select_related("profile", "preferences")


def get_user(*, pk: int) -> User:
    return get_object_or_404(user_queryset(), pk=pk)


def profile_queryset() -> QuerySet[Profile]:
    return Profile.objects.select_related("user").prefetch_related("interest_links__genre", "social_links")


def profile_for_user(*, user: Any) -> Profile | None:
    return profile_queryset().filter(user=user).first()


def get_profile_for_user(*, user: Any) -> Profile:
    return get_object_or_404(profile_queryset(), user=user)


def get_profile(*, pk: int) -> Profile:
    return get_object_or_404(profile_queryset(), pk=pk)


def preference_for_user(*, user: Any) -> UserPreference:
    preference, _created = UserPreference.objects.get_or_create(user=user)
    return preference


def is_same_user(*, target_user: User, viewer: Any) -> bool:
    return bool(viewer and viewer.is_authenticated and viewer.pk == target_user.pk)


def is_staff_viewer(*, viewer: Any) -> bool:
    return bool(viewer and viewer.is_authenticated and (viewer.is_staff or viewer.is_superuser))


def is_following_user(*, target_user: User, viewer: Any) -> bool:
    if not viewer or not viewer.is_authenticated or viewer.pk == target_user.pk:
        return False

    from apps.social.models import FollowRelationship

    return FollowRelationship.objects.filter(follower=viewer, following=target_user).exists()


def can_view_private_profile_data(*, target_user: User, viewer: Any) -> bool:
    return is_same_user(target_user=target_user, viewer=viewer) or is_staff_viewer(viewer=viewer)


def can_view_profile(*, target_user: User, viewer: Any) -> bool:
    if can_view_private_profile_data(target_user=target_user, viewer=viewer):
        return True

    preference = getattr(target_user, "preferences", None)
    return bool(preference is None or preference.profile_public)


def ensure_can_view_profile(*, target_user: User, viewer: Any) -> None:
    if not can_view_profile(target_user=target_user, viewer=viewer):
        raise PermissionDenied("This profile is private.")


def can_view_user_ratings(*, target_user: User, viewer: Any) -> bool:
    if can_view_private_profile_data(target_user=target_user, viewer=viewer):
        return True

    preference = getattr(target_user, "preferences", None)
    return bool(preference is None or preference.show_ratings_publicly)


def ensure_can_view_user_ratings(*, target_user: User, viewer: Any) -> None:
    ensure_can_view_profile(target_user=target_user, viewer=viewer)
    if not can_view_user_ratings(target_user=target_user, viewer=viewer):
        raise PermissionDenied("This profile does not share ratings publicly.")


def profile_viewer_context(*, target_user: User, viewer: Any) -> dict[str, bool]:
    return {
        "is_self": is_same_user(target_user=target_user, viewer=viewer),
        "is_following": is_following_user(target_user=target_user, viewer=viewer),
        "can_view_private": can_view_private_profile_data(target_user=target_user, viewer=viewer),
    }
