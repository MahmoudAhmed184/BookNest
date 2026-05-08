from django.contrib import admin

from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog, SearchThrottleBucket


@admin.register(SearchQueryLog)
class SearchQueryLogAdmin(admin.ModelAdmin):
    list_display = ("normalized_query", "user", "source", "status", "result_count", "created_at")
    search_fields = ("query", "normalized_query", "user__email")
    list_filter = ("source", "status", "cache_hit", "external_enrichment_requested")


@admin.register(SearchThrottleBucket)
class SearchThrottleBucketAdmin(admin.ModelAdmin):
    list_display = ("scope", "key_hash", "window_start", "request_count", "blocked_until")
    search_fields = ("key_hash",)
    list_filter = ("scope",)


@admin.register(SearchAutocompleteTerm)
class SearchAutocompleteTermAdmin(admin.ModelAdmin):
    list_display = ("term", "term_type", "weight", "use_count", "is_active", "last_seen_at")
    search_fields = ("term",)
    list_filter = ("term_type", "is_active")


@admin.register(SearchIndexStatus)
class SearchIndexStatusAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "last_rebuilt_at", "document_count")
    search_fields = ("name", "error_message")
    list_filter = ("status",)
