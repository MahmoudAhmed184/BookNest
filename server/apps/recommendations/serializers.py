from __future__ import annotations

from rest_framework import serializers

from apps.books.serializers import BookSerializer
from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationFeedback,
    RecommendationModel,
    RecommendationRun,
    UserRecommendation,
)


class RecommendationModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationModel
        fields = "__all__"


class RecommendationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationRun
        fields = "__all__"


class UserRecommendationSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)

    class Meta:
        model = UserRecommendation
        fields = [
            "id",
            "user",
            "book",
            "book_detail",
            "model",
            "source",
            "rank",
            "score",
            "reason",
            "generated_at",
            "expires_at",
            "is_active",
            "is_dismissed",
            "viewed_at",
            "clicked_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "user", "created_at", "updated_at")


class CatalogRecommendationSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)

    class Meta:
        model = CatalogRecommendation
        fields = "__all__"


class RecommendationFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationFeedback
        fields = "__all__"
        read_only_fields = ("user",)
        validators = []
