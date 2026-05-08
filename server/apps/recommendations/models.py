from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from apps.common.models import TimeStampedModel


class RecommendationModel(TimeStampedModel):
    class ModelType(models.TextChoices):
        SVD = "svd", "SVD"
        NMF = "nmf", "NMF"
        KNN = "knn", "KNN"
        CONTENT = "content", "Content based"
        HYBRID = "hybrid", "Hybrid"
        POPULARITY = "popularity", "Popularity"

    name = models.CharField(max_length=120)
    version = models.CharField(max_length=64, db_index=True)
    model_type = models.CharField(max_length=24, choices=ModelType.choices, db_index=True)
    is_active = models.BooleanField(default=False, db_index=True)
    rmse = models.DecimalField(
        max_digits=8, decimal_places=5, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    mae = models.DecimalField(max_digits=8, decimal_places=5, null=True, blank=True, validators=[MinValueValidator(0)])
    min_ratings_threshold = models.PositiveIntegerField(default=5)
    generated_at = models.DateTimeField(default=timezone.now, db_index=True)
    training_sample_size = models.PositiveIntegerField(default=0)
    artifact_uri = models.CharField(max_length=500, blank=True)
    metrics = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        def persist(save_kwargs):
            with transaction.atomic():
                result = super(RecommendationModel, self).save(*args, **save_kwargs)
                if self.is_active:
                    type(self).objects.exclude(pk=self.pk).update(is_active=False)
                return result

        try:
            return persist(kwargs)
        except type(self).NotUpdated:
            if kwargs.get("force_update"):
                retry_kwargs = {**kwargs}
                retry_kwargs.pop("force_update", None)
                retry_kwargs.pop("update_fields", None)
                return persist(retry_kwargs)
            raise

    class Meta:
        ordering = ("-is_active", "-generated_at")
        indexes = [
            models.Index(fields=["is_active"], name="recmodel_active_idx"),
            models.Index(fields=["model_type", "generated_at"], name="recmodel_type_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["model_type", "version"], name="uniq_recmodel_version"),
            models.CheckConstraint(condition=models.Q(min_ratings_threshold__gte=0), name="recmodel_minratings_chk"),
        ]
        verbose_name = "recommendation model"
        verbose_name_plural = "recommendation models"

    def __str__(self) -> str:
        return f"{self.model_type}:{self.version}"


class RecommendationRun(TimeStampedModel):
    class RunType(models.TextChoices):
        TRAIN = "train", "Train"
        GENERATE = "generate", "Generate"
        REFRESH = "refresh", "Refresh"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILURE = "failure", "Failure"

    model = models.ForeignKey(
        RecommendationModel, related_name="runs", null=True, blank=True, on_delete=models.SET_NULL
    )
    task_log = models.OneToOneField(
        "operations.TaskLog", related_name="recommendation_run", null=True, blank=True, on_delete=models.SET_NULL
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="recommendation_runs", null=True, blank=True, on_delete=models.SET_NULL
    )
    run_type = models.CharField(max_length=16, choices=RunType.choices, db_index=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    parameters = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["run_type", "status"], name="recrun_type_status_idx"),
            models.Index(fields=["started_at"], name="recrun_started_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(finished_at__isnull=True) | models.Q(finished_at__gte=models.F("started_at")),
                name="recrun_finished_chk",
            )
        ]
        verbose_name = "recommendation run"
        verbose_name_plural = "recommendation runs"

    def __str__(self) -> str:
        return f"{self.run_type}:{self.status}:{self.started_at}"


class UserRecommendation(TimeStampedModel):
    class Source(models.TextChoices):
        PERSONALIZED = "personalized", "Personalized"
        FALLBACK = "fallback", "Fallback"
        TRENDING = "trending", "Trending"
        FEATURED = "featured", "Featured"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="recommendations", on_delete=models.CASCADE)
    book = models.ForeignKey("books.Book", related_name="user_recommendations", on_delete=models.CASCADE)
    model = models.ForeignKey(RecommendationModel, related_name="user_recommendations", on_delete=models.PROTECT)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.PERSONALIZED, db_index=True)
    rank = models.PositiveIntegerField(db_index=True)
    score = models.DecimalField(max_digits=10, decimal_places=6, default=0, validators=[MinValueValidator(0)])
    reason = models.JSONField(default=dict, blank=True)
    generated_at = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_dismissed = models.BooleanField(default=False, db_index=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("user_id", "rank")
        indexes = [
            models.Index(fields=["user", "is_active", "rank"], name="userrec_user_rank_idx"),
            models.Index(fields=["book", "score"], name="userrec_book_score_idx"),
            models.Index(fields=["generated_at"], name="userrec_generated_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "book", "model"], name="uniq_user_book_model_rec"),
            models.UniqueConstraint(fields=["user", "model", "rank"], name="uniq_user_model_rank"),
            models.CheckConstraint(condition=models.Q(rank__gte=1), name="userrec_rank_chk"),
            models.CheckConstraint(condition=models.Q(score__gte=0), name="userrec_score_chk"),
        ]
        verbose_name = "user recommendation"
        verbose_name_plural = "user recommendations"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.book_id}:{self.rank}"


class CatalogRecommendation(TimeStampedModel):
    class Source(models.TextChoices):
        POPULAR = "popular", "Popular"
        TRENDING = "trending", "Trending"
        FEATURED = "featured", "Featured"
        NEW_RELEASE = "new_release", "New release"

    book = models.ForeignKey("books.Book", related_name="catalog_recommendations", on_delete=models.CASCADE)
    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)
    rank = models.PositiveIntegerField(db_index=True)
    score = models.DecimalField(max_digits=10, decimal_places=6, default=0, validators=[MinValueValidator(0)])
    generated_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    reason = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("source", "rank")
        indexes = [
            models.Index(fields=["source", "is_active", "rank"], name="catrec_source_rank_idx"),
            models.Index(fields=["generated_at"], name="catrec_generated_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["source", "generated_at", "rank"], name="uniq_catrec_batch_rank"),
            models.CheckConstraint(condition=models.Q(rank__gte=1), name="catrec_rank_chk"),
        ]
        verbose_name = "catalog recommendation"
        verbose_name_plural = "catalog recommendations"

    def __str__(self) -> str:
        return f"{self.source}:{self.rank}:{self.book_id}"


class RecommendationFeedback(TimeStampedModel):
    class FeedbackType(models.TextChoices):
        VIEWED = "viewed", "Viewed"
        CLICKED = "clicked", "Clicked"
        DISMISSED = "dismissed", "Dismissed"
        NOT_INTERESTED = "not_interested", "Not interested"
        SAVED = "saved", "Saved"
        READ = "read", "Read"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="recommendation_feedback", on_delete=models.CASCADE
    )
    book = models.ForeignKey("books.Book", related_name="recommendation_feedback", on_delete=models.CASCADE)
    recommendation = models.ForeignKey(
        UserRecommendation, related_name="feedback", null=True, blank=True, on_delete=models.SET_NULL
    )
    feedback_type = models.CharField(max_length=20, choices=FeedbackType.choices, db_index=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "feedback_type"], name="recfb_user_type_idx"),
            models.Index(fields=["book"], name="recfb_book_idx"),
        ]
        constraints = [models.UniqueConstraint(fields=["user", "book", "feedback_type"], name="uniq_rec_feedback")]
        verbose_name = "recommendation feedback"
        verbose_name_plural = "recommendation feedback"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.book_id}:{self.feedback_type}"
