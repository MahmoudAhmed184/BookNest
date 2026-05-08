from django.contrib import admin

from apps.social.models import FeedEvent, FollowRelationship


@admin.register(FollowRelationship)
class FollowRelationshipAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")
    search_fields = ("follower__email", "following__email")


@admin.register(FeedEvent)
class FeedEventAdmin(admin.ModelAdmin):
    list_display = ("actor", "event_type", "book", "visibility", "occurred_at")
    search_fields = ("actor__email", "book__title")
    list_filter = ("event_type", "visibility")
