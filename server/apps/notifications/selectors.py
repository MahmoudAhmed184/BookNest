from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.notifications.models import Notification

if TYPE_CHECKING:
    from django.db.models import QuerySet


def notifications_for_user(
    *,
    user: Any,
    is_read: bool | None = None,
    notification_type: str | None = None,
) -> QuerySet[Notification]:
    queryset = Notification.objects.for_recipient(user).select_related(
        "recipient",
        "actor_content_type",
        "target_content_type",
        "action_object_content_type",
    )
    if is_read is not None:
        queryset = queryset.filter(is_read=is_read)
    if notification_type:
        queryset = queryset.filter(notification_type=notification_type)
    return queryset


def get_notification_for_user(*, notification_id: int, user: Any) -> Notification:
    return get_object_or_404(notifications_for_user(user=user), id=notification_id)


def unread_count_for_user(*, user: Any) -> int:
    return Notification.objects.for_recipient(user).unread().count()
