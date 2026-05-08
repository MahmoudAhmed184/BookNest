from django.contrib import admin

from apps.collections.models import CollectionBook, ReadingCollection, ReadingProgress


@admin.register(ReadingCollection)
class ReadingCollectionAdmin(admin.ModelAdmin):
    list_display = ("owner", "name", "list_type", "privacy", "is_default", "item_count", "is_archived")
    search_fields = ("owner__email", "name", "description")
    list_filter = ("list_type", "privacy", "is_default", "is_archived")


@admin.register(CollectionBook)
class CollectionBookAdmin(admin.ModelAdmin):
    list_display = ("collection", "book", "status", "position", "added_at", "is_archived")
    search_fields = ("collection__name", "book__title", "notes")
    list_filter = ("status", "is_archived")


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "status", "percent_complete", "last_read_at", "is_archived")
    search_fields = ("user__email", "book__title")
    list_filter = ("status", "is_archived")
