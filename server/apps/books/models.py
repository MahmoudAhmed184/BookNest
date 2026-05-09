from cloudinary.models import CloudinaryField
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models

from apps.common.models import SoftDeleteModel, TimeStampedModel

isbn13_validator = RegexValidator(r"^\d{13}$", "ISBN-13 must contain exactly 13 digits.")
isbn10_validator = RegexValidator(r"^[0-9X]{10}$", "ISBN-10 must contain exactly 10 digits or X.")


class MariaDBFullTextIndex(models.Index):
    suffix = "ftx"

    def create_sql(self, model, schema_editor, using="", **kwargs):
        if schema_editor.connection.vendor == "mysql":
            kwargs["sql"] = "CREATE FULLTEXT INDEX %(name)s ON %(table)s (%(columns)s)%(extra)s"
        return super().create_sql(model, schema_editor, using=using, **kwargs)


class BookQuerySet(models.QuerySet):
    def visible(self):
        return self.filter(is_archived=False, is_public=True)


class Author(TimeStampedModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        OPENLIBRARY = "openlibrary", "OpenLibrary"
        GOOGLE_BOOKS = "google_books", "Google Books"
        IMPORT = "import", "Import"

    name = models.CharField(max_length=255, db_index=True)
    normalized_name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    bio = models.TextField(blank=True)
    photo = CloudinaryField("author_photos", blank=True)
    photo_fallback_url = models.CharField(max_length=500, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    death_date = models.DateField(null=True, blank=True)
    source = models.CharField(max_length=32, choices=Source.choices, default=Source.MANUAL, db_index=True)
    books_count = models.PositiveIntegerField(default=0, db_index=True)
    like_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ("name",)
        indexes = [
            models.Index(fields=["normalized_name"], name="author_norm_name_idx"),
            models.Index(fields=["books_count"], name="author_books_count_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=~models.Q(name=""), name="author_name_not_blank"),
            models.CheckConstraint(
                condition=models.Q(death_date__isnull=True)
                | models.Q(birth_date__isnull=True)
                | models.Q(death_date__gte=models.F("birth_date")),
                name="author_dates_chk",
            ),
        ]
        verbose_name = "author"
        verbose_name_plural = "authors"

    def __str__(self) -> str:
        return self.name


class AuthorLike(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="author_likes", on_delete=models.CASCADE)
    author = models.ForeignKey(Author, related_name="likes", on_delete=models.CASCADE)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user"], name="authorlike_user_idx"),
            models.Index(fields=["author"], name="authorlike_author_idx"),
        ]
        constraints = [models.UniqueConstraint(fields=["user", "author"], name="uniq_user_author_like")]
        verbose_name = "author like"
        verbose_name_plural = "author likes"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.author_id}"


class Genre(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    normalized_name = models.CharField(max_length=120, db_index=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey("self", related_name="children", null=True, blank=True, on_delete=models.SET_NULL)
    books_count = models.PositiveIntegerField(default=0, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    carousel_rank = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ("name",)
        indexes = [
            models.Index(fields=["parent", "name"], name="genre_parent_name_idx"),
            models.Index(fields=["is_featured", "carousel_rank"], name="genre_featured_idx"),
        ]
        constraints = [models.CheckConstraint(condition=~models.Q(name=""), name="genre_name_not_blank")]
        verbose_name = "genre"
        verbose_name_plural = "genres"

    def __str__(self) -> str:
        return self.name


class Book(SoftDeleteModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        OPENLIBRARY = "openlibrary", "OpenLibrary"
        GOOGLE_BOOKS = "google_books", "Google Books"
        IMPORT = "import", "Import"
        USER_SUBMITTED = "user_submitted", "User submitted"

    title = models.CharField(max_length=500, db_index=True)
    subtitle = models.CharField(max_length=500, blank=True)
    slug = models.SlugField(max_length=520, unique=True)
    description = models.TextField(blank=True)
    isbn_13 = models.CharField(max_length=13, unique=True, null=True, blank=True, validators=[isbn13_validator])
    isbn_10 = models.CharField(max_length=10, unique=True, null=True, blank=True, validators=[isbn10_validator])
    authors = models.ManyToManyField(
        Author,
        through="BookAuthor",
        through_fields=("book", "author"),
        related_name="books",
        blank=True,
    )
    genres = models.ManyToManyField(
        Genre,
        through="BookGenre",
        through_fields=("book", "genre"),
        related_name="books",
        blank=True,
    )
    related_books = models.ManyToManyField(
        "self",
        through="RelatedBook",
        through_fields=("from_book", "to_book"),
        symmetrical=False,
        related_name="related_to",
        blank=True,
    )
    cover = CloudinaryField("book_covers", blank=True)
    cover_fallback_url = models.CharField(max_length=500, blank=True)
    publisher = models.CharField(max_length=255, blank=True, db_index=True)
    publication_date = models.DateField(null=True, blank=True, db_index=True)
    publication_year = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    page_count = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    language = models.CharField(max_length=12, blank=True, db_index=True)
    source = models.CharField(max_length=32, choices=Source.choices, default=Source.MANUAL, db_index=True)
    external_last_synced_at = models.DateTimeField(null=True, blank=True)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        db_index=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    rating_count = models.PositiveIntegerField(default=0, db_index=True)
    review_count = models.PositiveIntegerField(default=0)
    collection_count = models.PositiveIntegerField(default=0)
    read_count = models.PositiveIntegerField(default=0)
    author_names = models.TextField(blank=True)
    genre_labels = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    featured_rank = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    popularity_score = models.DecimalField(max_digits=12, decimal_places=4, default=0, db_index=True)
    trending_score = models.DecimalField(max_digits=12, decimal_places=4, default=0, db_index=True)
    is_adult = models.BooleanField(default=False, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)

    objects = BookQuerySet.as_manager()

    class Meta:
        ordering = ("-trending_score", "title")
        indexes = [
            MariaDBFullTextIndex(
                fields=["title", "subtitle", "author_names", "genre_labels", "description", "isbn_13", "isbn_10"],
                name="book_fulltext_idx",
            ),
            models.Index(fields=["is_archived", "is_public", "title"], name="book_visible_title_idx"),
            models.Index(fields=["average_rating", "rating_count"], name="book_rating_idx"),
            models.Index(fields=["publication_year", "page_count"], name="book_pub_pages_idx"),
            models.Index(fields=["is_featured", "featured_rank"], name="book_featured_idx"),
            models.Index(fields=["trending_score"], name="book_trending_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=~models.Q(title=""), name="book_title_not_blank"),
            models.CheckConstraint(
                condition=models.Q(isbn_13__isnull=True) | ~models.Q(isbn_13=""),
                name="book_isbn13_not_blank",
            ),
            models.CheckConstraint(
                condition=models.Q(isbn_10__isnull=True) | ~models.Q(isbn_10=""),
                name="book_isbn10_not_blank",
            ),
            models.CheckConstraint(
                condition=models.Q(page_count__isnull=True) | models.Q(page_count__gte=1),
                name="book_page_count_chk",
            ),
            models.CheckConstraint(
                condition=models.Q(average_rating__gte=0) & models.Q(average_rating__lte=5),
                name="book_avg_rating_chk",
            ),
        ]
        verbose_name = "book"
        verbose_name_plural = "books"

    def __str__(self) -> str:
        return self.title


class BookAuthor(TimeStampedModel):
    class Role(models.TextChoices):
        AUTHOR = "author", "Author"
        EDITOR = "editor", "Editor"
        TRANSLATOR = "translator", "Translator"
        ILLUSTRATOR = "illustrator", "Illustrator"
        NARRATOR = "narrator", "Narrator"
        CONTRIBUTOR = "contributor", "Contributor"

    book = models.ForeignKey(Book, related_name="book_authors", on_delete=models.CASCADE)
    author = models.ForeignKey(Author, related_name="book_authors", on_delete=models.CASCADE)
    role = models.CharField(max_length=24, choices=Role.choices, default=Role.AUTHOR, db_index=True)
    position = models.PositiveSmallIntegerField(default=0, db_index=True)
    contribution_note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("book_id", "position", "author__name")
        indexes = [
            models.Index(fields=["book", "position"], name="bookauthor_book_pos_idx"),
            models.Index(fields=["author", "role"], name="bookauthor_author_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["book", "author", "role"], name="uniq_book_author_role"),
            models.CheckConstraint(condition=models.Q(position__gte=0), name="bookauthor_pos_chk"),
        ]
        verbose_name = "book author"
        verbose_name_plural = "book authors"

    def __str__(self) -> str:
        return f"{self.book_id}:{self.author_id}:{self.role}"


class BookGenre(TimeStampedModel):
    book = models.ForeignKey(Book, related_name="book_genres", on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, related_name="book_genres", on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False, db_index=True)
    position = models.PositiveSmallIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ("book_id", "position", "genre__name")
        indexes = [
            models.Index(fields=["book", "position"], name="bookgenre_book_pos_idx"),
            models.Index(fields=["genre", "is_primary"], name="bookgenre_genre_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["book", "genre"], name="uniq_book_genre"),
            models.CheckConstraint(condition=models.Q(position__gte=0), name="bookgenre_pos_chk"),
        ]
        verbose_name = "book genre"
        verbose_name_plural = "book genres"

    def __str__(self) -> str:
        return f"{self.book_id}:{self.genre_id}"


class RelatedBook(TimeStampedModel):
    class RelationType(models.TextChoices):
        SIMILAR = "similar", "Similar"
        SAME_AUTHOR = "same_author", "Same author"
        SAME_GENRE = "same_genre", "Same genre"
        ALSO_LIKED = "also_liked", "Also liked"
        MANUAL = "manual", "Manual"
        EXTERNAL = "external", "External"

    from_book = models.ForeignKey(Book, related_name="outgoing_related_books", on_delete=models.CASCADE)
    to_book = models.ForeignKey(Book, related_name="incoming_related_books", on_delete=models.CASCADE)
    relation_type = models.CharField(
        max_length=24, choices=RelationType.choices, default=RelationType.SIMILAR, db_index=True
    )
    score = models.DecimalField(
        max_digits=5, decimal_places=4, default=0, validators=[MinValueValidator(0), MaxValueValidator(1)]
    )
    source = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ("from_book_id", "-score")
        indexes = [
            models.Index(fields=["from_book", "score"], name="related_from_score_idx"),
            models.Index(fields=["to_book"], name="related_to_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["from_book", "to_book", "relation_type"], name="uniq_related_book_type"),
            models.CheckConstraint(
                condition=~models.Q(from_book_id=models.F("to_book_id")), name="no_self_related_book"
            ),
            models.CheckConstraint(
                condition=models.Q(score__gte=0) & models.Q(score__lte=1), name="related_score_chk"
            ),
        ]
        verbose_name = "related book"
        verbose_name_plural = "related books"

    def __str__(self) -> str:
        return f"{self.from_book_id}->{self.to_book_id}:{self.relation_type}"


class BookTrendSnapshot(TimeStampedModel):
    class Period(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        ALL_TIME = "all_time", "All time"

    book = models.ForeignKey(Book, related_name="trend_snapshots", on_delete=models.CASCADE)
    period = models.CharField(max_length=20, choices=Period.choices, db_index=True)
    metric_date = models.DateField(db_index=True)
    view_count = models.PositiveIntegerField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    review_count = models.PositiveIntegerField(default=0)
    collection_add_count = models.PositiveIntegerField(default=0)
    search_click_count = models.PositiveIntegerField(default=0)
    score = models.DecimalField(max_digits=12, decimal_places=4, default=0, db_index=True)

    class Meta:
        ordering = ("-metric_date", "-score")
        indexes = [
            models.Index(fields=["period", "metric_date", "score"], name="trend_period_score_idx"),
            models.Index(fields=["book", "period"], name="trend_book_period_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["book", "period", "metric_date"], name="uniq_book_trend_day"),
            models.CheckConstraint(condition=models.Q(score__gte=0), name="trend_score_nonneg_chk"),
        ]
        verbose_name = "book trend snapshot"
        verbose_name_plural = "book trend snapshots"

    def __str__(self) -> str:
        return f"{self.book_id}:{self.period}:{self.metric_date}"
