from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Q
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
    return Profile.objects.select_related("user", "user__preferences").prefetch_related(
        "interest_links__genre",
        "social_links",
    )


def visible_profiles_for_viewer(*, viewer: Any) -> QuerySet[Profile]:
    queryset = profile_queryset()
    if is_staff_viewer(viewer=viewer):
        return queryset

    public_filter = Q(user__preferences__isnull=True) | Q(user__preferences__profile_public=True)
    if viewer and viewer.is_authenticated:
        return queryset.filter(public_filter | Q(user=viewer))
    return queryset.filter(public_filter)


def get_profile_for_user(*, user: Any) -> Profile:
    return get_object_or_404(profile_queryset(), user=user)


def get_profile_by_handle(*, handle: str) -> Profile:
    return get_object_or_404(profile_queryset(), handle=handle)


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


def profile_overview_for_user(
    *,
    target_user: User,
    viewer: Any,
    profile: Profile | None = None,
) -> dict[str, Any]:
    from apps.collections import selectors as collection_selectors
    from apps.reviews import selectors as review_selectors

    ensure_can_view_profile(target_user=target_user, viewer=viewer)
    profile = profile or get_profile_for_user(user=target_user)
    reviews = review_selectors.reviews_for_target_user(target_user=target_user, viewer=viewer)
    ratings = review_selectors.visible_ratings_for_profile_overview(
        target_user=target_user,
        viewer=viewer,
    )
    collections = collection_selectors.collections_for_target_user(
        target_user=target_user,
        viewer=viewer,
    )

    return {
        "user": target_user,
        "profile": profile,
        "viewer_context": profile_viewer_context(target_user=target_user, viewer=viewer),
        "stats": {
            "followers_count": target_user.follower_relationships.count(),
            "following_count": target_user.following_relationships.count(),
            "reviews_count": reviews.count(),
            "ratings_count": ratings.count(),
            "collections_count": collections.count(),
            "books_read_count": profile.books_read_count,
        },
        "recent_reviews": list(reviews[:5]),
        "recent_ratings": list(ratings[:5]),
        "recent_collections": list(collections[:5]),
    }
