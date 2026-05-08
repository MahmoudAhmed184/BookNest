from django.contrib import admin

from apps.integrations.models import (
    BookExternalIdentifier,
    ExternalBookRecord,
    ExternalCatalogSource,
    ExternalEnrichmentRequest,
    ExternalSyncRun,
    ExternalSyncState,
)


@admin.register(ExternalCatalogSource)
class ExternalCatalogSourceAdmin(admin.ModelAdmin):
    list_display = ("provider", "display_name", "is_active", "priority", "last_sync_at")
    search_fields = ("provider", "display_name", "base_url")
    list_filter = ("provider", "is_active")


@admin.register(BookExternalIdentifier)
class BookExternalIdentifierAdmin(admin.ModelAdmin):
    list_display = ("book", "source", "identifier_type", "external_id")
    search_fields = ("book__title", "external_id", "external_url")
    list_filter = ("identifier_type", "source")


@admin.register(ExternalBookRecord)
class ExternalBookRecordAdmin(admin.ModelAdmin):
    list_display = ("source", "external_id", "title", "merge_status", "confidence", "fetched_at")
    search_fields = ("external_id", "title", "isbn_13", "isbn_10", "author_names")
    list_filter = ("source", "merge_status")


@admin.register(ExternalEnrichmentRequest)
class ExternalEnrichmentRequestAdmin(admin.ModelAdmin):
    list_display = ("status", "priority", "book", "source", "requested_by", "requested_at")
    search_fields = ("query", "isbn_13", "isbn_10", "error_message")
    list_filter = ("status", "priority", "source")


@admin.register(ExternalSyncRun)
class ExternalSyncRunAdmin(admin.ModelAdmin):
    list_display = ("source", "sync_type", "status", "started_at", "finished_at")
    search_fields = ("query", "error_message")
    list_filter = ("sync_type", "status", "source")


@admin.register(ExternalSyncState)
class ExternalSyncStateAdmin(admin.ModelAdmin):
    list_display = ("source", "sync_kind", "last_success_at", "last_error_at", "total_records_seen")
    search_fields = ("sync_kind", "last_error_message")
