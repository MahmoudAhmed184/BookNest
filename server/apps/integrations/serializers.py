from __future__ import annotations

from rest_framework import serializers

from apps.integrations.models import (
    BookExternalIdentifier,
    ExternalBookRecord,
    ExternalCatalogSource,
    ExternalEnrichmentRequest,
    ExternalSyncRun,
    ExternalSyncState,
)


class ExternalCatalogSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalCatalogSource
        fields = "__all__"


class BookExternalIdentifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookExternalIdentifier
        fields = "__all__"


class ExternalBookRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalBookRecord
        fields = "__all__"


class ExternalEnrichmentRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalEnrichmentRequest
        fields = "__all__"
        read_only_fields = ("requested_by", "task_log", "started_at", "completed_at", "error_message")


class ExternalSyncRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalSyncRun
        fields = "__all__"


class ExternalSyncStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalSyncState
        fields = "__all__"
