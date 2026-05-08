from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class FollowRelationship(TimeStampedModel):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="following_relationships", on_delete=models.CASCADE
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="follower_relationships", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["follower"], name="follow_follower_idx"),
            models.Index(fields=["following"], name="follow_following_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="uniq_follow_pair"),
            models.CheckConstraint(condition=~models.Q(follower_id=models.F("following_id")), name="no_self_follow"),
        ]
        verbose_name = "follow relationship"
        verbose_name_plural = "follow relationships"

    def __str__(self) -> str:
        return f"{self.follower_id}->{self.following_id}"


class FeedEvent(TimeStampedModel):
    class EventType(models.TextChoices):
        RATING_CREATED = "rating_created", "Rating created"
        REVIEW_CREATED = "review_created", "Review created"
        USER_FOLLOWED = "user_followed", "User followed"
        COLLECTION_CREATED = "collection_created", "Collection created"
        BOOK_ADDED = "book_added", "Book added"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        FOLLOWERS = "followers", "Followers"
        PRIVATE = "private", "Private"

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="feed_events", on_delete=models.CASCADE)
    event_type = models.CharField(max_length=32, choices=EventType.choices, db_index=True)
    book = models.ForeignKey(
        "books.Book", related_name="feed_events", null=True, blank=True, on_delete=models.SET_NULL
    )
    target_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    target_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    target = GenericForeignKey("target_content_type", "target_object_id")
    action_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    action_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    action_object = GenericForeignKey("action_content_type", "action_object_id")
    visibility = models.CharField(max_length=12, choices=Visibility.choices, default=Visibility.PUBLIC, db_index=True)
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-occurred_at", "-id")
        indexes = [
            models.Index(fields=["visibility", "occurred_at"], name="feed_public_idx"),
            models.Index(fields=["actor", "occurred_at"], name="feed_actor_idx"),
            models.Index(fields=["event_type", "occurred_at"], name="feed_event_type_idx"),
            models.Index(fields=["book", "occurred_at"], name="feed_book_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(target_content_type__isnull=True, target_object_id__isnull=True)
                    | models.Q(target_content_type__isnull=False, target_object_id__isnull=False)
                ),
                name="feed_target_pair_chk",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(action_content_type__isnull=True, action_object_id__isnull=True)
                    | models.Q(action_content_type__isnull=False, action_object_id__isnull=False)
                ),
                name="feed_action_pair_chk",
            ),
        ]
        verbose_name = "feed event"
        verbose_name_plural = "feed events"

    def __str__(self) -> str:
        return f"{self.actor_id}:{self.event_type}:{self.occurred_at}"
