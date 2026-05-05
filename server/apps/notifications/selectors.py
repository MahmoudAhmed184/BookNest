from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.notifications.models import Notification

if TYPE_CHECKING:
    from django.db.models import QuerySet


def notifications_for_user(
    *, user: Any, read: bool | None = None, notification_type: str | None = None
) -> QuerySet[Notification]:
    queryset = Notification.objects.for_recipient(user).with_related()
    if read is not None:
        queryset = queryset.filter(read=read)
    if notification_type:
        queryset = queryset.filter(notification_type__name=notification_type)
    return queryset.order_by("-timestamp")


def get_notification_for_user(*, notification_id: int, user: Any) -> Notification:
    return get_object_or_404(
        Notification.objects.for_recipient(user).with_related(),
        id=notification_id,
    )


def unread_count_for_user(*, user: Any) -> int:
    return Notification.objects.for_recipient(user).unread().count()
