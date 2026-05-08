from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(TimeStampedModel):
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True, db_index=True)
    archive_reason = models.CharField(max_length=255, blank=True)

    def archive(self, reason: str = "") -> None:
        self.is_archived = True
        self.archived_at = timezone.now()
        self.archive_reason = reason
        self.save(update_fields=["is_archived", "archived_at", "archive_reason", "updated_at"])

    def delete(self, using=None, keep_parents=False):
        self.archive()

    class Meta:
        abstract = True
