from __future__ import annotations

from rest_framework import serializers

from apps.operations.models import TaskLog


class TaskLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskLog
        fields = [
            "id",
            "task_id",
            "task_type",
            "status",
            "started_at",
            "finished_at",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")
