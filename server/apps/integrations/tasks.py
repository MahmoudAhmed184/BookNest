from celery import shared_task
from django.utils import timezone

from apps.integrations.models import ExternalEnrichmentRequest, ExternalSyncState
from apps.integrations.services import ensure_default_sources, search_and_merge_external_books


@shared_task(name="apps.integrations.tasks.sync_external_books")
def sync_external_books() -> int:
    sources = ensure_default_sources()
    for source in sources:
        ExternalSyncState.objects.update_or_create(
            source=source,
            defaults={"last_success_at": timezone.now(), "last_error_message": ""},
        )
    return len(sources)


@shared_task(name="apps.integrations.tasks.process_external_enrichment_request")
def process_external_enrichment_request(request_id: int, page_size: int = 20) -> dict[str, int]:
    request = ExternalEnrichmentRequest.objects.select_related("requested_by").get(pk=request_id)
    request.status = ExternalEnrichmentRequest.Status.RUNNING
    request.started_at = timezone.now()
    request.error_message = ""
    request.save(update_fields=["status", "started_at", "error_message", "updated_at"])
    try:
        query = request.query or request.isbn_13 or request.isbn_10
        stats = search_and_merge_external_books(query=query, limit=page_size)
        request.status = ExternalEnrichmentRequest.Status.SUCCESS
        request.completed_at = timezone.now()
        request.save(update_fields=["status", "completed_at", "updated_at"])
        return stats
    except Exception as exc:
        request.status = ExternalEnrichmentRequest.Status.FAILURE
        request.completed_at = timezone.now()
        request.error_message = str(exc)
        request.save(update_fields=["status", "completed_at", "error_message", "updated_at"])
        raise


def enqueue_external_enrichment_request(*, request: ExternalEnrichmentRequest, page_size: int = 20):
    return process_external_enrichment_request.apply_async(
        args=[request.id],
        kwargs={"page_size": page_size},
        retry=False,
    )

