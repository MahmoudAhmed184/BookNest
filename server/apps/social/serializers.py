from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.books.serializers import BookSerializer
from apps.social.models import FeedEvent, FollowRelationship
from apps.users.serializers import ProfileSummarySerializer, UserSerializer

User = get_user_model()


def display_label(value: object | None) -> str | None:
    if value is None:
        return None
    name = getattr(value, "name", None)
    if isinstance(name, str) and name.strip():
        return name.strip()
    return str(value)


class FollowRelationshipSerializer(serializers.ModelSerializer):
    follower_detail = UserSerializer(source="follower", read_only=True)
    follower_profile = ProfileSummarySerializer(source="follower.profile", read_only=True)
    following_detail = UserSerializer(source="following", read_only=True)
    following_profile = ProfileSummarySerializer(source="following.profile", read_only=True)
    following = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FollowRelationship
        fields = [
            "id",
            "follower",
            "follower_detail",
            "follower_profile",
            "following",
            "following_detail",
            "following_profile",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "follower", "created_at", "updated_at")


class FeedEventSerializer(serializers.ModelSerializer):
    actor_detail = UserSerializer(source="actor", read_only=True)
    book_detail = BookSerializer(source="book", read_only=True)
    target_label = serializers.SerializerMethodField()
    action_object_label = serializers.SerializerMethodField()

    class Meta:
        model = FeedEvent
        fields = [
            "id",
            "actor",
            "actor_detail",
            "event_type",
            "book",
            "book_detail",
            "target_label",
            "action_object_label",
            "visibility",
            "occurred_at",
            "payload",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "actor", "occurred_at", "created_at", "updated_at")

    def get_target_label(self, obj: FeedEvent) -> str | None:
        return display_label(obj.target)

    def get_action_object_label(self, obj: FeedEvent) -> str | None:
        return display_label(obj.action_object)
