from django.contrib import admin

from apps.operations.models import TaskLog


@admin.register(TaskLog)
class TaskLogAdmin(admin.ModelAdmin):
    list_display = ("task_id", "task_type", "status", "started_at", "finished_at")
    search_fields = ("task_id", "task_type", "error_message")
    list_filter = ("task_type", "status")
