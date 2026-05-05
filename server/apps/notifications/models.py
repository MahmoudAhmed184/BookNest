from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.notifications.managers import NotificationManager, NotificationTypeManager


class NotificationType(models.Model):
    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID",
        help_text="Primary identifier for the notification type.",
    )
    name = models.CharField(
        verbose_name="name",
        max_length=100,
        unique=True,
        help_text="Unique machine-readable notification type name.",
    )
    description = models.TextField(
        verbose_name="description",
        blank=True,
        help_text="Human-readable description of when this notification type is used.",
    )
    objects = NotificationTypeManager()

    def __str__(self) -> str:
        return self.name


class Notification(models.Model):
    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID",
        help_text="Primary identifier for the notification.",
    )
    # Who the notification is for
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="recipient",
        help_text="User who receives the notification.",
    )

    # Who triggered the notification (optional)
    actor_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="actor_notifications",
        null=True,
        blank=True,
        verbose_name="actor content type",
        help_text="Content type for the object that triggered the notification.",
    )
    actor_object_id = models.CharField(
        verbose_name="actor object ID",
        max_length=255,
        null=True,
        blank=True,
        help_text="Primary key of the object that triggered the notification.",
    )
    actor = GenericForeignKey("actor_content_type", "actor_object_id")

    # The verb describing the action (e.g., "commented on", "liked", "followed")
    verb = models.CharField(
        verbose_name="verb",
        max_length=255,
        help_text="Short phrase describing the notification action.",
    )

    # The object the action was performed on (optional)
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="target_notifications",
        null=True,
        blank=True,
        verbose_name="target content type",
        help_text="Content type for the notification target object.",
    )
    target_object_id = models.CharField(
        verbose_name="target object ID",
        max_length=255,
        null=True,
        blank=True,
        help_text="Primary key of the target object.",
    )
    target = GenericForeignKey("target_content_type", "target_object_id")

    # The object that was created by the action (optional)
    action_object_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="action_object_notifications",
        null=True,
        blank=True,
        verbose_name="action object content type",
        help_text="Content type for the created action object.",
    )
    action_object_id = models.CharField(
        verbose_name="action object ID",
        max_length=255,
        null=True,
        blank=True,
        help_text="Primary key of the created action object.",
    )
    action_object = GenericForeignKey("action_object_content_type", "action_object_id")

    # Type of notification for filtering
    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
        verbose_name="notification type",
        help_text="Classification used for filtering notifications.",
    )

    # Additional data stored as JSON
    data = models.JSONField(
        verbose_name="data",
        default=dict,
        blank=True,
        help_text="Additional structured notification payload.",
    )

    # Status fields
    read = models.BooleanField(
        verbose_name="read",
        default=False,
        help_text="Whether the recipient has read the notification.",
    )
    timestamp = models.DateTimeField(
        verbose_name="timestamp",
        auto_now_add=True,
        help_text="Timestamp when the notification was created.",
    )
    objects = NotificationManager()

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["recipient"]),
            models.Index(fields=["read"]),
        ]

    def __str__(self) -> str:
        return f"{self.recipient.username} - {self.verb}"

    def mark_as_read(self) -> None:
        """
        Mark the notification as read.
        """
        if not self.read:
            self.read = True
            self.save(update_fields=["read"])

    def mark_as_unread(self) -> None:
        """
        Mark the notification as unread.
        """
        if self.read:
            self.read = False
            self.save(update_fields=["read"])


# Create default notification types
def create_default_notification_types() -> None:
    """
    Create default notification types if they don't exist.
    This can be called in a migration or when the app is ready.
    """
    default_types = [
        {"name": "follow", "description": "When someone follows you"},
        {"name": "unfollow", "description": "When someone unfollows you"},
        {"name": "book_review", "description": "When someone reviews a book you authored or are following"},
        {"name": "book_rating", "description": "When someone rates a book you authored or are following"},
        {"name": "mention", "description": "When someone mentions you in a comment or review"},
        {"name": "system", "description": "System notifications"},
    ]

    for type_data in default_types:
        NotificationType.objects.get_or_create(
            name=type_data["name"], defaults={"description": type_data["description"]}
        )
