from __future__ import annotations

import logging
from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.reviews.models import Rating, Review, ReviewVote
from apps.social.models import FollowRelationship

logger = logging.getLogger(__name__)
User = get_user_model()


def _in_app_enabled(user: Any, *, preference_name: str | None = None) -> bool:
    try:
        preferences = user.preferences
    except AttributeError:
        return True
    if not preferences.in_app_notifications_enabled:
        return False
    return preference_name is None or getattr(preferences, preference_name, True)


def _create_after_commit(**kwargs) -> None:
    def create() -> None:
        try:
            create_notification(**kwargs)
        except Exception as exc:
            logger.warning("Could not create notification: %s", exc)

    transaction.on_commit(create)


def _profile_activity_public(user: Any, *, rating_event: bool = False) -> bool:
    try:
        preferences = user.preferences
    except AttributeError:
        return True
    if not preferences.profile_public:
        return False
    return not rating_event or preferences.show_ratings_publicly


def _create_for_followers_after_commit(*, actor: Any, **kwargs) -> None:
    def create() -> None:
        followers = FollowRelationship.objects.select_related("follower").filter(following=actor)
        for relationship in followers:
            recipient = relationship.follower
            if recipient.pk == actor.pk or not _in_app_enabled(recipient):
                continue
            try:
                create_notification(recipient=recipient, actor=actor, **kwargs)
            except Exception as exc:
                logger.warning("Could not create follower activity notification: %s", exc)

    transaction.on_commit(create)


@receiver(post_save, sender=User)
def user_welcome_notification(sender, instance, created: bool, **_kwargs) -> None:
    del sender
    if not created or not _in_app_enabled(instance):
        return
    _create_after_commit(
        recipient=instance,
        notification_type=Notification.NotificationType.SYSTEM,
        action=Notification.Action.SYSTEM_MESSAGE,
        payload={"message": "Welcome to BookNest."},
    )


@receiver(post_save, sender=FollowRelationship)
def follow_notification(sender, instance: FollowRelationship, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.follower_id == instance.following_id:
        return
    if not _in_app_enabled(instance.following, preference_name="notify_on_follow"):
        return
    _create_after_commit(
        recipient=instance.following,
        actor=instance.follower,
        target=instance.following,
        action_object=instance,
        notification_type=Notification.NotificationType.SOCIAL,
        action=Notification.Action.FOLLOWED,
        payload={"follower_id": instance.follower_id},
    )


@receiver(post_save, sender=Review)
def review_created_notification(sender, instance: Review, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived:
        return
    if not _profile_activity_public(instance.user):
        return
    _create_for_followers_after_commit(
        actor=instance.user,
        target=instance.book,
        action_object=instance,
        notification_type=Notification.NotificationType.REVIEW,
        action=Notification.Action.REVIEWED_BOOK,
        payload={"review_id": instance.id, "book_id": instance.book_id},
    )


@receiver(post_save, sender=Rating)
def rating_created_notification(sender, instance: Rating, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived:
        return
    if not _profile_activity_public(instance.user, rating_event=True):
        return
    _create_for_followers_after_commit(
        actor=instance.user,
        target=instance.book,
        action_object=instance,
        notification_type=Notification.NotificationType.RATING,
        action=Notification.Action.RATED_BOOK,
        payload={"rating_id": instance.id, "book_id": instance.book_id, "rating": instance.value},
    )


@receiver(post_save, sender=ReviewVote)
def review_vote_notification(sender, instance: ReviewVote, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.user_id == instance.review.user_id:
        return
    recipient = instance.review.user
    if not _in_app_enabled(recipient, preference_name="notify_on_review_vote"):
        return
    action = (
        Notification.Action.REVIEW_UPVOTED
        if instance.vote_type == ReviewVote.VoteType.UP
        else Notification.Action.REVIEW_DOWNVOTED
    )
    _create_after_commit(
        recipient=recipient,
        actor=instance.user,
        target=instance.review.book,
        action_object=instance.review,
        notification_type=Notification.NotificationType.REVIEW,
        action=action,
        payload={
            "review_id": instance.review_id,
            "book_id": instance.review.book_id,
            "vote_type": instance.vote_type,
        },
    )
