from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.common.models import SoftDeleteModel


class ReadingListType(models.TextChoices):
    TODO = "todo", "To read"
    DOING = "doing", "Reading"
    DONE = "done", "Read"
    CUSTOM = "custom", "Custom"


class CollectionPrivacy(models.TextChoices):
    PUBLIC = "public", "Public"
    PRIVATE = "private", "Private"


class ReadingCollection(SoftDeleteModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reading_collections", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, db_index=True)
    description = models.TextField(blank=True)
    list_type = models.CharField(
        max_length=12, choices=ReadingListType.choices, default=ReadingListType.CUSTOM, db_index=True
    )
    privacy = models.CharField(
        max_length=10, choices=CollectionPrivacy.choices, default=CollectionPrivacy.PUBLIC, db_index=True
    )
    books = models.ManyToManyField(
        "books.Book",
        through="CollectionBook",
        through_fields=("collection", "book"),
        related_name="collections",
        blank=True,
    )
    is_default = models.BooleanField(default=False, db_index=True)
    item_count = models.PositiveIntegerField(default=0)
    last_book_added_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("owner_id", "list_type", "name")
        indexes = [
            models.Index(fields=["owner", "privacy", "list_type"], name="collection_owner_idx"),
            models.Index(fields=["is_archived", "privacy"], name="collection_visible_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["owner", "slug"], name="uniq_owner_collection_slug"),
            models.CheckConstraint(condition=~models.Q(name=""), name="collection_name_not_blank"),
            models.CheckConstraint(condition=models.Q(item_count__gte=0), name="collection_items_chk"),
        ]
        verbose_name = "reading collection"
        verbose_name_plural = "reading collections"

    def __str__(self) -> str:
        return f"{self.owner_id}:{self.name}"


class CollectionBook(SoftDeleteModel):
    collection = models.ForeignKey(ReadingCollection, related_name="items", on_delete=models.CASCADE)
    book = models.ForeignKey("books.Book", related_name="collection_items", on_delete=models.CASCADE)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="collection_additions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    status = models.CharField(
        max_length=12, choices=ReadingListType.choices, default=ReadingListType.TODO, db_index=True
    )
    position = models.PositiveIntegerField(default=0, db_index=True)
    notes = models.TextField(blank=True)
    added_at = models.DateTimeField(default=timezone.now, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("collection_id", "position", "added_at")
        indexes = [
            models.Index(fields=["collection", "position"], name="collbook_coll_pos_idx"),
            models.Index(fields=["book", "status"], name="collbook_book_status_idx"),
            models.Index(fields=["is_archived", "added_at"], name="collbook_arch_added_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["collection", "book"], name="uniq_collection_book"),
            models.CheckConstraint(condition=models.Q(position__gte=0), name="collbook_position_chk"),
            models.CheckConstraint(
                condition=models.Q(finished_at__isnull=True)
                | models.Q(started_at__isnull=True)
                | models.Q(finished_at__gte=models.F("started_at")),
                name="collbook_dates_chk",
            ),
        ]
        verbose_name = "collection book"
        verbose_name_plural = "collection books"

    def __str__(self) -> str:
        return f"{self.collection_id}:{self.book_id}"


class ReadingProgress(SoftDeleteModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reading_progress", on_delete=models.CASCADE)
    book = models.ForeignKey("books.Book", related_name="reading_progress", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=12, choices=ReadingListType.choices, default=ReadingListType.TODO, db_index=True
    )
    current_page = models.PositiveIntegerField(default=0)
    percent_complete = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    marked_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("user_id", "status", "-updated_at")
        indexes = [
            models.Index(fields=["user", "status"], name="progress_user_status_idx"),
            models.Index(fields=["book", "status"], name="progress_book_status_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "book"], name="uniq_user_book_progress"),
            models.CheckConstraint(
                condition=models.Q(percent_complete__gte=0) & models.Q(percent_complete__lte=100),
                name="progress_percent_chk",
            ),
            models.CheckConstraint(
                condition=models.Q(finished_at__isnull=True)
                | models.Q(started_at__isnull=True)
                | models.Q(finished_at__gte=models.F("started_at")),
                name="progress_dates_chk",
            ),
        ]
        verbose_name = "reading progress"
        verbose_name_plural = "reading progress"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.book_id}:{self.status}"
