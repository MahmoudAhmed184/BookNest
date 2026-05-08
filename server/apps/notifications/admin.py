from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "action", "notification_type", "is_read", "is_deleted", "created_at")
    search_fields = ("recipient__email", "action")
    list_filter = ("notification_type", "action", "is_read", "is_deleted")
