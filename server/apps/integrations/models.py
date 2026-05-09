from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel

isbn13_validator = RegexValidator(r"^\d{13}$", "ISBN-13 must contain exactly 13 digits.")
isbn10_validator = RegexValidator(r"^[0-9X]{10}$", "ISBN-10 must contain exactly 10 digits or X.")


class ExternalCatalogSource(TimeStampedModel):
    class Provider(models.TextChoices):
        OPENLIBRARY = "openlibrary", "OpenLibrary"
        GOOGLE_BOOKS = "google_books", "Google Books"

    provider = models.CharField(max_length=32, choices=Provider.choices, unique=True)
    display_name = models.CharField(max_length=120)
    base_url = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True, db_index=True)
    priority = models.PositiveSmallIntegerField(default=10, db_index=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("priority", "display_name")
        indexes = [models.Index(fields=["is_active", "priority"], name="extsource_active_idx")]
        constraints = [
            models.CheckConstraint(condition=~models.Q(display_name=""), name="extsource_name_chk"),
        ]
        verbose_name = "external catalog source"
        verbose_name_plural = "external catalog sources"

    def __str__(self) -> str:
        return self.provider


class BookExternalIdentifier(TimeStampedModel):
    class IdentifierType(models.TextChoices):
        WORK = "work", "Work"
        EDITION = "edition", "Edition"
        VOLUME = "volume", "Volume"
        OTHER = "other", "Other"

    book = models.ForeignKey("books.Book", related_name="external_identifiers", on_delete=models.CASCADE)
    source = models.ForeignKey(ExternalCatalogSource, related_name="book_identifiers", on_delete=models.CASCADE)
    identifier_type = models.CharField(
        max_length=16, choices=IdentifierType.choices, default=IdentifierType.OTHER, db_index=True
    )
    external_id = models.CharField(max_length=255, db_index=True)
    external_url = models.URLField(max_length=500, blank=True)

    class Meta:
        ordering = ("book_id", "source_id", "identifier_type")
        indexes = [
            models.Index(fields=["source", "external_id"], name="extid_source_idx"),
            models.Index(fields=["book", "source"], name="extid_book_source_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["source", "identifier_type", "external_id"], name="uniq_ext_identifier"),
            models.UniqueConstraint(fields=["book", "source", "identifier_type"], name="uniq_book_extid_type"),
            models.CheckConstraint(condition=~models.Q(external_id=""), name="extid_not_blank"),
        ]
        verbose_name = "book external identifier"
        verbose_name_plural = "book external identifiers"

    def __str__(self) -> str:
        return f"{self.source_id}:{self.identifier_type}:{self.external_id}"


class ExternalBookRecord(TimeStampedModel):
    class MergeStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        MATCHED = "matched", "Matched"
        MERGED = "merged", "Merged"
        REJECTED = "rejected", "Rejected"
        ERROR = "error", "Error"

    source = models.ForeignKey(ExternalCatalogSource, related_name="book_records", on_delete=models.CASCADE)
    external_id = models.CharField(max_length=255, db_index=True)
    isbn_13 = models.CharField(max_length=13, blank=True, validators=[isbn13_validator], db_index=True)
    isbn_10 = models.CharField(max_length=10, blank=True, validators=[isbn10_validator], db_index=True)
    title = models.CharField(max_length=500, blank=True)
    subtitle = models.CharField(max_length=500, blank=True)
    author_names = models.TextField(blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    normalized_payload = models.JSONField(default=dict, blank=True)
    matched_book = models.ForeignKey(
        "books.Book", related_name="external_records", null=True, blank=True, on_delete=models.SET_NULL
    )
    merge_status = models.CharField(
        max_length=16, choices=MergeStatus.choices, default=MergeStatus.PENDING, db_index=True
    )
    confidence = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
    )
    fetched_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ("-fetched_at",)
        indexes = [
            models.Index(fields=["source", "merge_status"], name="extrec_source_status_idx"),
            models.Index(fields=["isbn_13"], name="extrec_isbn13_idx"),
            models.Index(fields=["isbn_10"], name="extrec_isbn10_idx"),
            models.Index(fields=["matched_book"], name="extrec_matched_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["source", "external_id"], name="uniq_ext_record"),
            models.CheckConstraint(condition=~models.Q(external_id=""), name="extrec_external_id_chk"),
            models.CheckConstraint(
                condition=models.Q(confidence__isnull=True)
                | (models.Q(confidence__gte=0) & models.Q(confidence__lte=1)),
                name="extrec_confidence_chk",
            ),
        ]
        verbose_name = "external book record"
        verbose_name_plural = "external book records"

    def __str__(self) -> str:
        return f"{self.source_id}:{self.external_id}"


class ExternalEnrichmentRequest(TimeStampedModel):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILURE = "failure", "Failure"
        CANCELLED = "cancelled", "Cancelled"

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="external_enrichment_requests",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    book = models.ForeignKey(
        "books.Book", related_name="external_enrichment_requests", null=True, blank=True, on_delete=models.SET_NULL
    )
    source = models.ForeignKey(
        ExternalCatalogSource,
        related_name="enrichment_requests",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    task_log = models.OneToOneField(
        "operations.TaskLog",
        related_name="external_enrichment_request",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    query = models.CharField(max_length=500, blank=True)
    isbn_13 = models.CharField(max_length=13, blank=True, validators=[isbn13_validator])
    isbn_10 = models.CharField(max_length=10, blank=True, validators=[isbn10_validator])
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED, db_index=True)
    priority = models.PositiveSmallIntegerField(default=5, db_index=True)
    requested_at = models.DateTimeField(default=timezone.now, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("priority", "requested_at")
        indexes = [
            models.Index(fields=["status", "priority", "requested_at"], name="enrich_status_prio_idx"),
            models.Index(fields=["book"], name="enrich_book_idx"),
            models.Index(fields=["requested_by"], name="enrich_user_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    ~models.Q(query="") | models.Q(book__isnull=False) | ~models.Q(isbn_13="") | ~models.Q(isbn_10="")
                ),
                name="enrich_has_input_chk",
            ),
            models.CheckConstraint(
                condition=models.Q(completed_at__isnull=True)
                | models.Q(started_at__isnull=True)
                | models.Q(completed_at__gte=models.F("started_at")),
                name="enrich_dates_chk",
            ),
        ]
        verbose_name = "external enrichment request"
        verbose_name_plural = "external enrichment requests"

    def __str__(self) -> str:
        return f"{self.status}:{self.query or self.book_id}"


class ExternalSyncRun(TimeStampedModel):
    class SyncType(models.TextChoices):
        FULL = "full", "Full"
        INCREMENTAL = "incremental", "Incremental"
        QUERY = "query", "Query"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILURE = "failure", "Failure"

    source = models.ForeignKey(ExternalCatalogSource, related_name="sync_runs", on_delete=models.CASCADE)
    task_log = models.OneToOneField(
        "operations.TaskLog", related_name="external_sync_run", null=True, blank=True, on_delete=models.SET_NULL
    )
    sync_type = models.CharField(max_length=16, choices=SyncType.choices, db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    query = models.CharField(max_length=500, blank=True)
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    books_seen = models.PositiveIntegerField(default=0)
    books_created = models.PositiveIntegerField(default=0)
    books_updated = models.PositiveIntegerField(default=0)
    books_merged = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["source", "status"], name="sync_source_status_idx"),
            models.Index(fields=["sync_type", "started_at"], name="sync_type_started_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(finished_at__isnull=True) | models.Q(finished_at__gte=models.F("started_at")),
                name="sync_finished_chk",
            )
        ]
        verbose_name = "external sync run"
        verbose_name_plural = "external sync runs"

    def __str__(self) -> str:
        return f"{self.source_id}:{self.sync_type}:{self.status}"


class ExternalSyncState(TimeStampedModel):
    source = models.OneToOneField(ExternalCatalogSource, related_name="sync_state", on_delete=models.CASCADE)
    sync_kind = models.CharField(max_length=32, default="catalog", db_index=True)
    # Documented provider sync state API; retained for cursor-based providers.
    cursor_token = models.CharField(max_length=500, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error_at = models.DateTimeField(null=True, blank=True)
    last_error_message = models.TextField(blank=True)
    total_records_seen = models.PositiveIntegerField(default=0)
    total_records_saved = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("source_id",)
        indexes = [models.Index(fields=["sync_kind"], name="syncstate_kind_idx")]
        constraints = []
        verbose_name = "external sync state"
        verbose_name_plural = "external sync states"

    def __str__(self) -> str:
        return f"{self.source_id}:{self.sync_kind}"
