from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.common.models import SoftDeleteModel, TimeStampedModel


class Rating(SoftDeleteModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="ratings", on_delete=models.CASCADE)
    book = models.ForeignKey("books.Book", related_name="ratings", on_delete=models.CASCADE)
    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    rated_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ("-rated_at", "-created_at")
        indexes = [
            models.Index(fields=["book", "value"], name="rating_book_value_idx"),
            models.Index(fields=["user", "rated_at"], name="rating_user_date_idx"),
            models.Index(fields=["is_archived", "rated_at"], name="rating_arch_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "book"], name="uniq_user_book_rating"),
            models.CheckConstraint(condition=models.Q(value__gte=1) & models.Q(value__lte=5), name="rating_value_chk"),
        ]
        verbose_name = "rating"
        verbose_name_plural = "ratings"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.book_id}:{self.value}"


class Review(SoftDeleteModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="reviews", on_delete=models.CASCADE)
    book = models.ForeignKey("books.Book", related_name="reviews", on_delete=models.CASCADE)
    rating = models.OneToOneField(Rating, related_name="review", null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    contains_spoilers = models.BooleanField(default=False, db_index=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(default=timezone.now, db_index=True)
    upvote_count = models.PositiveIntegerField(default=0, db_index=True)
    downvote_count = models.PositiveIntegerField(default=0)
    score = models.IntegerField(default=0, db_index=True)

    class Meta:
        ordering = ("-reviewed_at", "-created_at")
        indexes = [
            models.Index(fields=["book", "reviewed_at"], name="review_book_date_idx"),
            models.Index(fields=["book", "upvote_count"], name="review_book_votes_idx"),
            models.Index(fields=["user", "reviewed_at"], name="review_user_date_idx"),
            models.Index(fields=["is_archived", "reviewed_at"], name="review_arch_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "book"], name="uniq_user_book_review"),
            models.CheckConstraint(condition=~models.Q(body=""), name="review_body_not_blank"),
            models.CheckConstraint(condition=models.Q(upvote_count__gte=0), name="review_upvotes_chk"),
            models.CheckConstraint(condition=models.Q(downvote_count__gte=0), name="review_downvotes_chk"),
        ]
        verbose_name = "review"
        verbose_name_plural = "reviews"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.book_id}"


class ReviewVote(TimeStampedModel):
    class VoteType(models.TextChoices):
        UP = "up", "Upvote"
        DOWN = "down", "Downvote"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="review_votes", on_delete=models.CASCADE)
    review = models.ForeignKey(Review, related_name="votes", on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=8, choices=VoteType.choices, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["review", "vote_type"], name="rvote_review_type_idx"),
            models.Index(fields=["user"], name="rvote_user_idx"),
        ]
        constraints = [models.UniqueConstraint(fields=["user", "review"], name="uniq_user_review_vote")]
        verbose_name = "review vote"
        verbose_name_plural = "review votes"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.review_id}:{self.vote_type}"
