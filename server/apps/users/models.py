from cloudinary.models import CloudinaryField
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    display_name = models.CharField(max_length=150, blank=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False, db_index=True)
    date_joined = models.DateTimeField(default=timezone.now, db_index=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        ordering = ("email",)
        indexes = [
            models.Index(fields=["is_active", "is_staff"], name="user_active_staff_idx"),
            models.Index(fields=["date_joined"], name="user_joined_idx"),
            models.Index(fields=["display_name"], name="user_display_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=~models.Q(email=""), name="user_email_not_blank"),
            models.CheckConstraint(
                condition=models.Q(deactivated_at__isnull=True) | models.Q(is_active=False),
                name="user_deactivated_inactive",
            ),
        ]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.email


class Profile(TimeStampedModel):
    class ProfileType(models.TextChoices):
        READER = "reader", "Reader"
        CREATOR = "creator", "Creator"
        LIBRARIAN = "librarian", "Librarian"
        STAFF = "staff", "Staff"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="profile", on_delete=models.CASCADE)
    handle = models.SlugField(max_length=64, unique=True)
    bio = models.TextField(blank=True)
    profile_type = models.CharField(
        max_length=20, choices=ProfileType.choices, default=ProfileType.READER, db_index=True
    )
    picture = CloudinaryField("profile_pictures", blank=True)
    picture_fallback_url = models.CharField(max_length=500, blank=True)
    location = models.CharField(max_length=120, blank=True)
    website_url = models.URLField(max_length=500, blank=True)
    interests = models.ManyToManyField(
        "books.Genre",
        through="ProfileInterest",
        through_fields=("profile", "genre"),
        related_name="interested_profiles",
        blank=True,
    )
    is_complete = models.BooleanField(default=False, db_index=True)
    profile_completed_at = models.DateTimeField(null=True, blank=True)
    completion_percent = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    ratings_count = models.PositiveIntegerField(default=0)
    books_read_count = models.PositiveIntegerField(default=0)
    collections_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("handle",)
        indexes = [
            models.Index(fields=["is_complete", "profile_type"], name="profile_complete_idx"),
            models.Index(fields=["followers_count"], name="profile_followers_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(completion_percent__gte=0) & models.Q(completion_percent__lte=100),
                name="profile_completion_chk",
            ),
            models.CheckConstraint(
                condition=models.Q(is_complete=False) | models.Q(profile_completed_at__isnull=False),
                name="profile_complete_time_chk",
            ),
        ]
        verbose_name = "profile"
        verbose_name_plural = "profiles"

    def __str__(self) -> str:
        return self.handle


class UserPreference(TimeStampedModel):
    class PrivacyDefault(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="preferences", on_delete=models.CASCADE)
    email_notifications_enabled = models.BooleanField(default=True)
    in_app_notifications_enabled = models.BooleanField(default=True)
    notify_on_follow = models.BooleanField(default=True)
    notify_on_review_vote = models.BooleanField(default=True)
    profile_public = models.BooleanField(default=True, db_index=True)
    show_ratings_publicly = models.BooleanField(default=True)
    personalized_recommendations_enabled = models.BooleanField(default=True, db_index=True)
    external_enrichment_enabled = models.BooleanField(default=True)
    search_history_enabled = models.BooleanField(default=True)
    mature_content_enabled = models.BooleanField(default=False)
    default_collection_privacy = models.CharField(
        max_length=10,
        choices=PrivacyDefault.choices,
        default=PrivacyDefault.PUBLIC,
    )
    default_language = models.CharField(max_length=12, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")

    class Meta:
        ordering = ("user_id",)
        indexes = [
            models.Index(fields=["profile_public"], name="pref_profile_public_idx"),
            models.Index(fields=["personalized_recommendations_enabled"], name="pref_recs_enabled_idx"),
        ]
        constraints = []
        verbose_name = "user preference"
        verbose_name_plural = "user preferences"

    def __str__(self) -> str:
        return f"Preferences for {self.user_id}"


class ProfileInterest(TimeStampedModel):
    profile = models.ForeignKey(Profile, related_name="interest_links", on_delete=models.CASCADE)
    genre = models.ForeignKey("books.Genre", related_name="profile_interest_links", on_delete=models.CASCADE)
    weight = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(100)])

    class Meta:
        ordering = ("profile_id", "genre_id")
        indexes = [
            models.Index(fields=["profile", "weight"], name="interest_profile_idx"),
            models.Index(fields=["genre"], name="interest_genre_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["profile", "genre"], name="uniq_profile_genre"),
            models.CheckConstraint(
                condition=models.Q(weight__gte=1) & models.Q(weight__lte=100), name="interest_weight_chk"
            ),
        ]
        verbose_name = "profile interest"
        verbose_name_plural = "profile interests"

    def __str__(self) -> str:
        return f"{self.profile_id}:{self.genre_id}"


class UserSocialLink(TimeStampedModel):
    class Platform(models.TextChoices):
        WEBSITE = "website", "Website"
        GOODREADS = "goodreads", "Goodreads"
        STORYGRAPH = "storygraph", "StoryGraph"
        X = "x", "X"
        INSTAGRAM = "instagram", "Instagram"
        FACEBOOK = "facebook", "Facebook"
        TIKTOK = "tiktok", "TikTok"
        LINKEDIN = "linkedin", "LinkedIn"

    profile = models.ForeignKey(Profile, related_name="social_links", on_delete=models.CASCADE)
    platform = models.CharField(max_length=30, choices=Platform.choices, db_index=True)
    url = models.URLField(max_length=500)
    label = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ("profile_id", "platform")
        indexes = [models.Index(fields=["profile", "platform"], name="social_profile_idx")]
        constraints = [models.UniqueConstraint(fields=["profile", "platform"], name="uniq_profile_platform")]
        verbose_name = "user social link"
        verbose_name_plural = "user social links"

    def __str__(self) -> str:
        return f"{self.profile_id}:{self.platform}"
