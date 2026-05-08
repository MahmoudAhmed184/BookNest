from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class TaskLog(TimeStampedModel):
    class TaskType(models.TextChoices):
        EXTERNAL_BOOK_SYNC = "external_book_sync", "External book sync"
        QUERY_ENRICHMENT = "query_enrichment", "Query enrichment"
        RECOMMENDATION_TRAINING = "recommendation_training", "Recommendation training"
        RECOMMENDATION_GENERATION = "recommendation_generation", "Recommendation generation"
        SEARCH_INDEX_REBUILD = "search_index_rebuild", "Search index rebuild"
        CSV_EXPORT = "csv_export", "CSV export"
        DATA_REPAIR = "data_repair", "Data repair"
        RANDOM_TEST_DATA = "random_test_data", "Random test data"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILURE = "failure", "Failure"

    task_id = models.CharField(max_length=255, unique=True)
    task_type = models.CharField(max_length=40, choices=TaskType.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True, db_index=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-started_at", "-created_at")
        indexes = [
            models.Index(fields=["task_type", "status"], name="tasklog_type_status_idx"),
            models.Index(fields=["started_at"], name="tasklog_started_idx"),
            models.Index(fields=["finished_at"], name="tasklog_finished_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(finished_at__isnull=True) | models.Q(finished_at__gte=models.F("started_at")),
                name="tasklog_finished_after_start",
            )
        ]
        verbose_name = "task log"
        verbose_name_plural = "task logs"

    def __str__(self) -> str:
        return f"{self.task_type}:{self.task_id}:{self.status}"
