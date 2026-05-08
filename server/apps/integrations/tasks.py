from celery import shared_task
from django.utils import timezone

from apps.integrations.models import ExternalSyncRun, ExternalSyncState
from apps.integrations.services import ensure_default_sources


@shared_task(name="apps.integrations.tasks.sync_external_books")
def sync_external_books() -> int:
    sources = ensure_default_sources()
    for source in sources:
        ExternalSyncState.objects.update_or_create(
            source=source,
            defaults={"last_success_at": timezone.now(), "last_error_message": ""},
        )
    return len(sources)


@shared_task(name="apps.integrations.tasks.update_book_metadata")
def update_book_metadata() -> int:
    return ExternalSyncRun.objects.filter(status=ExternalSyncRun.Status.PENDING).count()
