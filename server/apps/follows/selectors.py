from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.follows.models import Follow
from apps.users.models.profile import Profile

if TYPE_CHECKING:
    from apps.follows.managers import FollowQuerySet  # noqa: F401


def follow_relationships_for_user(*, user: Any) -> FollowQuerySet:
    return (
        Follow.objects.involving_user(user)
        .select_related(
            "follower__user",
            "followed__user",
        )
        .order_by("-created_at")
    )


def follows_created_by_user(*, user: Any) -> FollowQuerySet:
    return following_for_profile(profile=user.profile)


def followers_for_profile(*, profile: Profile) -> FollowQuerySet:
    return (
        Follow.objects.followers_of(profile)
        .select_related(
            "follower__user",
            "followed__user",
        )
        .order_by("-created_at")
    )


def following_for_profile(*, profile: Profile) -> FollowQuerySet:
    return (
        Follow.objects.following_of(profile)
        .select_related(
            "follower__user",
            "followed__user",
        )
        .order_by("-created_at")
    )


def get_profile(*, profile_id: int) -> Profile:
    return get_object_or_404(Profile.objects.with_related(), id=profile_id)


def get_follow(*, follower: Profile, followed: Profile) -> Follow:
    return get_object_or_404(
        Follow.objects.select_related("follower__user", "followed__user"),
        follower=follower,
        followed=followed,
    )
