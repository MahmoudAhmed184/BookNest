from __future__ import annotations

from rest_framework import serializers

from apps.books.models import Book
from apps.books.serializers import BookSerializer
from apps.reviews.models import Rating, Review, ReviewVote


class RatingSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.visible(), required=False)

    class Meta:
        model = Rating
        fields = [
            "id",
            "user",
            "book",
            "book_detail",
            "value",
            "rated_at",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "user", "is_archived", "created_at", "updated_at")
        validators = []


class ReviewSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.visible(), required=False)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "book",
            "book_detail",
            "rating",
            "title",
            "body",
            "contains_spoilers",
            "is_edited",
            "edited_at",
            "reviewed_at",
            "upvote_count",
            "downvote_count",
            "score",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "user",
            "is_edited",
            "edited_at",
            "upvote_count",
            "downvote_count",
            "score",
            "is_archived",
            "created_at",
            "updated_at",
        )
        validators = []


class ReviewVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewVote
        fields = ["id", "user", "review", "vote_type", "created_at", "updated_at"]
        read_only_fields = ("id", "user", "created_at", "updated_at")
        validators = []
