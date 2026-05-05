from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models

if TYPE_CHECKING:
    from apps.notifications.models import Notification, NotificationType  # noqa: F401


class NotificationQuerySet(models.QuerySet["Notification"]):
    def for_recipient(self, user: Any) -> NotificationQuerySet:
        return self.filter(recipient=user)

    def unread(self) -> NotificationQuerySet:
        return self.filter(read=False)

    def read(self) -> NotificationQuerySet:
        return self.filter(read=True)

    def with_related(self) -> NotificationQuerySet:
        return self.select_related(
            "recipient",
            "notification_type",
            "actor_content_type",
            "target_content_type",
            "action_object_content_type",
        )


class NotificationManager(models.Manager["Notification"]):
    def get_queryset(self) -> NotificationQuerySet:
        return NotificationQuerySet(self.model, using=self._db)

    def for_recipient(self, user: Any) -> NotificationQuerySet:
        return self.get_queryset().for_recipient(user)

    def unread(self) -> NotificationQuerySet:
        return self.get_queryset().unread()

    def read(self) -> NotificationQuerySet:
        return self.get_queryset().read()

    def with_related(self) -> NotificationQuerySet:
        return self.get_queryset().with_related()


class NotificationTypeQuerySet(models.QuerySet["NotificationType"]):
    def named(self, name: str) -> NotificationTypeQuerySet:
        return self.filter(name=name)


class NotificationTypeManager(models.Manager["NotificationType"]):
    def get_queryset(self) -> NotificationTypeQuerySet:
        return NotificationTypeQuerySet(self.model, using=self._db)

    def named(self, name: str) -> NotificationTypeQuerySet:
        return self.get_queryset().named(name)
