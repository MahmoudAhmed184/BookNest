from __future__ import annotations

from rest_framework import serializers

from apps.books.serializers import BookSerializer
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog, SearchThrottleBucket


class SearchQueryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQueryLog
        fields = "__all__"


class SearchThrottleBucketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchThrottleBucket
        fields = "__all__"


class SearchAutocompleteTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchAutocompleteTerm
        fields = [
            "id",
            "term",
            "normalized_term",
            "term_type",
            "weight",
            "use_count",
            "target_content_type",
            "target_object_id",
            "last_seen_at",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("normalized_term", "created_at", "updated_at")


class SearchIndexStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchIndexStatus
        fields = "__all__"


class BookSearchResponseSerializer(serializers.Serializer):
    query = serializers.CharField()
    results = BookSerializer(many=True)
