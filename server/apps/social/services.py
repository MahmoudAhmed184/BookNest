from __future__ import annotations

from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.social.models import FeedEvent, FollowRelationship


def sync_follow_counts(*, follower: Any, following: Any) -> None:
    if hasattr(follower, "profile"):
        follower.profile.following_count = follower.following_relationships.count()
        follower.profile.save(update_fields=["following_count", "updated_at"])
    if hasattr(following, "profile"):
        following.profile.followers_count = following.follower_relationships.count()
        following.profile.save(update_fields=["followers_count", "updated_at"])


@transaction.atomic
def follow_user(*, follower: Any, following: Any) -> FollowRelationship:
    if follower == following:
        raise ValidationError({"following": "Users cannot follow themselves."})
    relationship, _created = FollowRelationship.objects.get_or_create(follower=follower, following=following)
    sync_follow_counts(follower=follower, following=following)
    target_content_type = ContentType.objects.get_for_model(following)
    FeedEvent.objects.get_or_create(
        actor=follower,
        event_type=FeedEvent.EventType.USER_FOLLOWED,
        target_content_type=target_content_type,
        target_object_id=following.pk,
        defaults={"visibility": FeedEvent.Visibility.PUBLIC},
    )
    return relationship


@transaction.atomic
def unfollow_user(*, relationship: FollowRelationship) -> None:
    follower = relationship.follower
    following = relationship.following
    relationship.delete()
    sync_follow_counts(follower=follower, following=following)
