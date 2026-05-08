from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Q

from apps.social.models import FeedEvent, FollowRelationship
from apps.users import selectors as user_selectors

if TYPE_CHECKING:
    from django.db.models import QuerySet


def follow_queryset() -> QuerySet[FollowRelationship]:
    return FollowRelationship.objects.select_related(
        "follower",
        "follower__profile",
        "following",
        "following__profile",
    )


def following_for_user(*, user: Any) -> QuerySet[FollowRelationship]:
    return follow_queryset().filter(follower=user)


def followers_for_user(*, user: Any) -> QuerySet[FollowRelationship]:
    return follow_queryset().filter(following=user)


def followers_for_target_user(*, target_user: Any, viewer: Any) -> QuerySet[FollowRelationship]:
    user_selectors.ensure_can_view_profile(target_user=target_user, viewer=viewer)
    return followers_for_user(user=target_user)


def following_for_target_user(*, target_user: Any, viewer: Any) -> QuerySet[FollowRelationship]:
    user_selectors.ensure_can_view_profile(target_user=target_user, viewer=viewer)
    return following_for_user(user=target_user)


def feed_for_user(*, user: Any) -> QuerySet[FeedEvent]:
    followed_ids = following_for_user(user=user).values_list("following_id", flat=True)
    return (
        FeedEvent.objects.select_related("actor", "book")
        .filter(Q(visibility=FeedEvent.Visibility.PUBLIC) | Q(actor=user) | Q(actor_id__in=followed_ids))
        .order_by("-occurred_at", "-id")
    )
