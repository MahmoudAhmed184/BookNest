from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from .models import Notification, NotificationType

if TYPE_CHECKING:
    from django.db.models import Model

User = get_user_model()


class NotificationTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for notification types.
    """

    class Meta:
        model = NotificationType
        fields = ["id", "name", "description"]


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications with detailed information about related objects.
    """

    actor_name = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()
    action_object_name = serializers.SerializerMethodField()
    notification_type_name = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(format="%a %b %d %Y at %I:%M %p", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "actor_name",
            "verb",
            "target_name",
            "action_object_name",
            "notification_type_name",
            "data",
            "read",
            "timestamp",
        ]
        read_only_fields = ("recipient", "timestamp")

    def get_actor_name(self, obj: Notification) -> str | None:
        """
        Get a string representation of the actor.
        """
        if obj.actor:
            if hasattr(obj.actor, "get_full_name"):
                return obj.actor.get_full_name() or obj.actor.username
            return str(obj.actor)
        return None

    def get_target_name(self, obj: Notification) -> str | None:
        """
        Get a string representation of the target.
        """
        if obj.target:
            return str(obj.target)
        return None

    def get_action_object_name(self, obj: Notification) -> str | None:
        """
        Get a string representation of the action object.
        """
        if obj.action_object:
            return str(obj.action_object)
        return None

    def get_notification_type_name(self, obj: Notification) -> str | None:
        """
        Get the name of the notification type.
        """
        if obj.notification_type:
            return obj.notification_type.name
        return None


class NotificationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating notifications through the API.
    This provides a simplified interface for creating notifications.
    """

    recipient_id = serializers.IntegerField()
    actor_id = serializers.IntegerField(required=False)
    verb = serializers.CharField(max_length=255)
    target_content_type = serializers.CharField(required=False)
    target_object_id = serializers.CharField(required=False)
    action_object_content_type = serializers.CharField(required=False)
    action_object_id = serializers.CharField(required=False)
    notification_type = serializers.CharField(required=False)
    data = serializers.JSONField(required=False, default=dict)

    def validate_recipient_id(self, value: int) -> int:
        try:
            User.objects.get(id=value)
            return value
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Recipient user does not exist") from exc

    def validate_actor_id(self, value: int | None) -> int | None:
        if value:
            try:
                User.objects.get(id=value)
                return value
            except User.DoesNotExist as exc:
                raise serializers.ValidationError("Actor user does not exist") from exc
        return value

    def validate_notification_type(self, value: str | None) -> str | None:
        if value:
            try:
                NotificationType.objects.get(name=value)
                return value
            except NotificationType.DoesNotExist as exc:
                raise serializers.ValidationError("Notification type does not exist") from exc
        return value

    def create(self, validated_data: dict[str, Any]) -> Notification:
        # Import here to avoid circular imports
        from .services import NotificationService

        recipient = User.objects.get(id=validated_data["recipient_id"])

        # Get actor if provided
        actor = None
        if "actor_id" in validated_data and validated_data["actor_id"]:
            actor = User.objects.get(id=validated_data["actor_id"])

        # Get target if provided
        target = self._get_related_object(
            content_type_model=validated_data.get("target_content_type"),
            object_id=validated_data.get("target_object_id"),
        )

        # Get action_object if provided
        action_object = self._get_related_object(
            content_type_model=validated_data.get("action_object_content_type"),
            object_id=validated_data.get("action_object_id"),
        )

        # Get notification_type if provided
        notification_type = None
        if "notification_type" in validated_data and validated_data["notification_type"]:
            notification_type = NotificationType.objects.get(name=validated_data["notification_type"])

        # Create notification using the service
        notification = NotificationService.create_notification(
            recipient=recipient,
            actor=actor,
            verb=validated_data["verb"],
            target=target,
            action_object=action_object,
            notification_type=notification_type,
            data=validated_data.get("data", {}),
        )

        return notification

    def _get_related_object(self, *, content_type_model: str | None, object_id: str | None) -> Model | None:
        if not content_type_model or not object_id:
            return None

        try:
            content_type = ContentType.objects.get(model=content_type_model)
        except ContentType.DoesNotExist:
            return None

        model_class = content_type.model_class()
        if model_class is None:
            return None

        try:
            return model_class._default_manager.get(id=object_id)
        except ObjectDoesNotExist:
            return None
