from __future__ import annotations

from rest_framework import serializers

from apps.notifications.models import Notification


def display_label(value: object | None) -> str | None:
    if value is None:
        return None
    name = getattr(value, "name", None)
    if isinstance(name, str) and name.strip():
        return name.strip()
    return str(value)


class NotificationSerializer(serializers.ModelSerializer):
    actor_label = serializers.SerializerMethodField()
    target_label = serializers.SerializerMethodField()
    action_object_label = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "actor_label",
            "target_label",
            "action_object_label",
            "notification_type",
            "action",
            "payload",
            "is_read",
            "read_at",
            "is_deleted",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "recipient",
            "actor_label",
            "target_label",
            "action_object_label",
            "read_at",
            "is_deleted",
            "deleted_at",
            "created_at",
            "updated_at",
        )

    def get_actor_label(self, obj: Notification) -> str | None:
        return display_label(obj.actor)

    def get_target_label(self, obj: Notification) -> str | None:
        return display_label(obj.target)

    def get_action_object_label(self, obj: Notification) -> str | None:
        return display_label(obj.action_object)


class NotificationCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField()


class NotificationUpdatedCountSerializer(serializers.Serializer):
    updated = serializers.IntegerField()
