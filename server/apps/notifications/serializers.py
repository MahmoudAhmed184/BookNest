from __future__ import annotations

from rest_framework import serializers

from apps.notifications.models import Notification


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
        return str(obj.actor) if obj.actor else None

    def get_target_label(self, obj: Notification) -> str | None:
        return str(obj.target) if obj.target else None

    def get_action_object_label(self, obj: Notification) -> str | None:
        return str(obj.action_object) if obj.action_object else None


class NotificationCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField()


class NotificationUpdatedCountSerializer(serializers.Serializer):
    updated = serializers.IntegerField()
