from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.selectors import get_notification_for_user, unread_count_for_user

if TYPE_CHECKING:
    from django.db.models import Model


def _generic_fk_values(obj: Model | None) -> dict[str, Any]:
    if obj is None:
        return {}
    return {
        "content_type": ContentType.objects.get_for_model(obj),
        "object_id": obj.pk,
    }


def create_notification(
    *,
    recipient: Any,
    notification_type: str,
    action: str,
    actor: Model | None = None,
    target: Model | None = None,
    action_object: Model | None = None,
    payload: dict[str, Any] | None = None,
) -> Notification:
    actor_values = _generic_fk_values(actor)
    target_values = _generic_fk_values(target)
    action_object_values = _generic_fk_values(action_object)
    notification = Notification.objects.create(
        recipient=recipient,
        actor_content_type=actor_values.get("content_type"),
        actor_object_id=actor_values.get("object_id"),
        target_content_type=target_values.get("content_type"),
        target_object_id=target_values.get("object_id"),
        action_object_content_type=action_object_values.get("content_type"),
        action_object_object_id=action_object_values.get("object_id"),
        notification_type=notification_type,
        action=action,
        payload=payload or {},
    )
    return notification


def mark_as_read(*, notification_id: int, user: Any) -> Notification:
    notification = get_notification_for_user(notification_id=notification_id, user=user)
    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return notification


def mark_as_unread(*, notification_id: int, user: Any) -> Notification:
    notification = get_notification_for_user(notification_id=notification_id, user=user)
    notification.is_read = False
    notification.read_at = None
    notification.save(update_fields=["is_read", "read_at", "updated_at"])
    return notification


def mark_all_as_read(*, user: Any) -> int:
    return Notification.objects.for_recipient(user).unread().mark_read()


def soft_delete_notification(*, notification_id: int, user: Any) -> Notification:
    notification = get_notification_for_user(notification_id=notification_id, user=user)
    notification.is_deleted = True
    notification.deleted_at = timezone.now()
    notification.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
    return notification


def get_unread_count(*, user: Any) -> int:
    return unread_count_for_user(user=user)
