from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class NotificationQuerySet(models.QuerySet):
    def visible(self):
        return self.filter(is_deleted=False)

    def unread(self):
        return self.visible().filter(is_read=False)

    def read(self):
        return self.visible().filter(is_read=True)

    def for_recipient(self, user):
        return self.visible().filter(recipient=user)

    def mark_read(self):
        return self.update(is_read=True, read_at=timezone.now())

    def mark_unread(self):
        return self.update(is_read=False, read_at=None)

    def unread_counts(self):
        return self.unread().values("recipient_id").annotate(unread_count=models.Count("id"))


class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        SOCIAL = "social", "Social"
        REVIEW = "review", "Review"
        RATING = "rating", "Rating"
        COLLECTION = "collection", "Collection"
        RECOMMENDATION = "recommendation", "Recommendation"
        SYSTEM = "system", "System"

    class Action(models.TextChoices):
        FOLLOWED = "followed", "Followed"
        RATED_BOOK = "rated_book", "Rated book"
        REVIEWED_BOOK = "reviewed_book", "Reviewed book"
        REVIEW_UPVOTED = "review_upvoted", "Review upvoted"
        REVIEW_DOWNVOTED = "review_downvoted", "Review downvoted"
        BOOK_ADDED_TO_COLLECTION = "book_added_to_collection", "Book added to collection"
        COLLECTION_SHARED = "collection_shared", "Collection shared"
        RECOMMENDATION_READY = "recommendation_ready", "Recommendation ready"
        SYSTEM_MESSAGE = "system_message", "System message"
        TASK_FAILED = "task_failed", "Task failed"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    actor_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    actor_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    actor = GenericForeignKey("actor_content_type", "actor_object_id")
    target_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    target_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    target = GenericForeignKey("target_content_type", "target_object_id")
    action_object_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    action_object_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    action_object = GenericForeignKey("action_object_content_type", "action_object_object_id")
    notification_type = models.CharField(max_length=24, choices=NotificationType.choices, db_index=True)
    action = models.CharField(max_length=40, choices=Action.choices, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = NotificationQuerySet.as_manager()

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(
                fields=["recipient", "is_read", "notification_type", "created_at"], name="notif_rec_read_type_idx"
            ),
            models.Index(fields=["recipient", "is_deleted", "created_at"], name="notif_rec_deleted_idx"),
            models.Index(fields=["action", "created_at"], name="notif_action_idx"),
            models.Index(fields=["actor_content_type", "actor_object_id"], name="notif_actor_idx"),
            models.Index(fields=["target_content_type", "target_object_id"], name="notif_target_idx"),
            models.Index(fields=["action_object_content_type", "action_object_object_id"], name="notif_object_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(is_read=False) | models.Q(read_at__isnull=False), name="notif_read_time_chk"
            ),
            models.CheckConstraint(
                condition=models.Q(is_deleted=False) | models.Q(deleted_at__isnull=False), name="notif_delete_time_chk"
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(actor_content_type__isnull=True, actor_object_id__isnull=True)
                    | models.Q(actor_content_type__isnull=False, actor_object_id__isnull=False)
                ),
                name="notif_actor_pair_chk",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(target_content_type__isnull=True, target_object_id__isnull=True)
                    | models.Q(target_content_type__isnull=False, target_object_id__isnull=False)
                ),
                name="notif_target_pair_chk",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(action_object_content_type__isnull=True, action_object_object_id__isnull=True)
                    | models.Q(action_object_content_type__isnull=False, action_object_object_id__isnull=False)
                ),
                name="notif_object_pair_chk",
            ),
        ]
        verbose_name = "notification"
        verbose_name_plural = "notifications"

    def __str__(self) -> str:
        return f"{self.recipient_id}:{self.action}:{self.notification_type}"
