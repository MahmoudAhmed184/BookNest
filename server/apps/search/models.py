from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.common.models import TimeStampedModel


class SearchQueryLog(TimeStampedModel):
    class Source(models.TextChoices):
        FULLTEXT = "fulltext", "Full-text"
        ORM = "orm", "ORM fallback"
        CACHE = "cache", "Cache"
        EXTERNAL = "external", "External"
        AUTOCOMPLETE = "autocomplete", "Autocomplete"

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        VALIDATION_ERROR = "validation_error", "Validation error"
        RATE_LIMITED = "rate_limited", "Rate limited"
        ENQUEUED = "enqueued", "Enqueued"
        ERROR = "error", "Error"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="search_queries", null=True, blank=True, on_delete=models.SET_NULL
    )
    query = models.CharField(max_length=500, blank=True)
    normalized_query = models.CharField(max_length=500, blank=True, db_index=True)
    filters = models.JSONField(default=dict, blank=True)
    sort = models.CharField(max_length=80, blank=True)
    page = models.PositiveIntegerField(default=1)
    page_size = models.PositiveIntegerField(default=20)
    result_count = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.FULLTEXT, db_index=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.SUCCESS, db_index=True)
    validation_errors = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    response_ms = models.PositiveIntegerField(null=True, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True, db_index=True)
    user_agent_hash = models.CharField(max_length=64, blank=True)
    external_enrichment_requested = models.BooleanField(default=False, db_index=True)
    cache_hit = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["normalized_query", "status", "created_at"], name="search_query_status_idx"),
            models.Index(fields=["user", "created_at"], name="search_user_date_idx"),
            models.Index(fields=["source", "cache_hit"], name="search_source_cache_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(page__gte=1), name="search_page_chk"),
            models.CheckConstraint(condition=models.Q(page_size__gte=1), name="search_page_size_chk"),
        ]
        verbose_name = "search query log"
        verbose_name_plural = "search query logs"

    def __str__(self) -> str:
        return f"{self.normalized_query}:{self.status}"


class SearchAutocompleteTerm(TimeStampedModel):
    class TermType(models.TextChoices):
        BOOK = "book", "Book"
        AUTHOR = "author", "Author"
        GENRE = "genre", "Genre"
        ISBN = "isbn", "ISBN"
        QUERY = "query", "Query"

    term = models.CharField(max_length=255)
    normalized_term = models.GeneratedField(
        expression=Lower("term"),
        output_field=models.CharField(max_length=255),
        db_persist=True,
        db_index=True,
    )
    term_type = models.CharField(max_length=16, choices=TermType.choices, db_index=True)
    weight = models.PositiveIntegerField(default=0, db_index=True)
    use_count = models.PositiveIntegerField(default=0)
    target_content_type = models.ForeignKey(
        ContentType, related_name="+", null=True, blank=True, on_delete=models.CASCADE
    )
    target_object_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    target = GenericForeignKey("target_content_type", "target_object_id")
    last_seen_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ("-weight", "term")
        indexes = [
            models.Index(fields=["normalized_term", "term_type"], name="autocomplete_norm_idx"),
            models.Index(fields=["term_type", "is_active", "weight"], name="autocomplete_type_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["term", "term_type"], name="uniq_autocomplete_term"),
            models.CheckConstraint(condition=~models.Q(term=""), name="autocomplete_term_chk"),
            models.CheckConstraint(
                condition=(
                    models.Q(target_content_type__isnull=True, target_object_id__isnull=True)
                    | models.Q(target_content_type__isnull=False, target_object_id__isnull=False)
                ),
                name="autocomplete_target_chk",
            ),
        ]
        verbose_name = "search autocomplete term"
        verbose_name_plural = "search autocomplete terms"

    def __str__(self) -> str:
        return f"{self.term_type}:{self.term}"


class SearchIndexStatus(TimeStampedModel):
    class IndexName(models.TextChoices):
        BOOKS = "books", "Books"
        AUTHORS = "authors", "Authors"
        GENRES = "genres", "Genres"

    class Status(models.TextChoices):
        IDLE = "idle", "Idle"
        REBUILDING = "rebuilding", "Rebuilding"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    name = models.CharField(max_length=24, choices=IndexName.choices, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IDLE, db_index=True)
    current_task = models.OneToOneField(
        "operations.TaskLog", related_name="search_index_status", null=True, blank=True, on_delete=models.SET_NULL
    )
    last_rebuilt_at = models.DateTimeField(null=True, blank=True)
    last_indexed_book = models.ForeignKey(
        "books.Book", related_name="search_index_markers", null=True, blank=True, on_delete=models.SET_NULL
    )
    document_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)
        indexes = [
            models.Index(fields=["status"], name="searchindex_status_idx"),
            models.Index(fields=["last_rebuilt_at"], name="searchindex_rebuilt_idx"),
        ]
        constraints = [models.CheckConstraint(condition=models.Q(document_count__gte=0), name="searchindex_count_chk")]
        verbose_name = "search index status"
        verbose_name_plural = "search index statuses"

    def __str__(self) -> str:
        return f"{self.name}:{self.status}"
