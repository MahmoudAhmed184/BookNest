from __future__ import annotations

from typing import TYPE_CHECKING

from apps.integrations.models import (
    ExternalEnrichmentRequest,
    ExternalSyncRun,
    ExternalSyncState,
)

if TYPE_CHECKING:
    from django.db.models import QuerySet


def enrichment_requests() -> QuerySet[ExternalEnrichmentRequest]:
    return ExternalEnrichmentRequest.objects.select_related("requested_by", "book", "source", "task_log")


def sync_runs() -> QuerySet[ExternalSyncRun]:
    return ExternalSyncRun.objects.select_related("source", "task_log")


def sync_states() -> QuerySet[ExternalSyncState]:
    return ExternalSyncState.objects.select_related("source")
