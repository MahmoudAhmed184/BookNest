from __future__ import annotations

from rest_framework import serializers

from apps.books.serializers import BookSerializer
from apps.collections.models import CollectionBook, ReadingCollection, ReadingProgress


class CollectionBookSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)

    class Meta:
        model = CollectionBook
        fields = [
            "id",
            "collection",
            "book",
            "book_detail",
            "added_by",
            "status",
            "position",
            "notes",
            "added_at",
            "started_at",
            "finished_at",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "added_by", "is_archived", "created_at", "updated_at")


class ReadingCollectionSerializer(serializers.ModelSerializer):
    items = CollectionBookSerializer(many=True, read_only=True)

    class Meta:
        model = ReadingCollection
        fields = [
            "id",
            "owner",
            "name",
            "slug",
            "description",
            "list_type",
            "privacy",
            "items",
            "is_default",
            "item_count",
            "last_book_added_at",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "owner",
            "is_default",
            "item_count",
            "last_book_added_at",
            "is_archived",
            "created_at",
            "updated_at",
        )
        validators = []


class ReadingProgressSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source="book", read_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            "id",
            "user",
            "book",
            "book_detail",
            "status",
            "current_page",
            "percent_complete",
            "started_at",
            "finished_at",
            "last_read_at",
            "marked_read_at",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "user", "is_archived", "created_at", "updated_at")
        validators = []
