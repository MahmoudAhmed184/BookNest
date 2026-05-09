from __future__ import annotations

from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.books.models import Genre
from apps.collections.serializers import ReadingCollectionSerializer
from apps.reviews.serializers import RatingSerializer, ReviewSerializer
from apps.users.models import Profile, ProfileInterest, User, UserPreference, UserSocialLink


class EmailRegisterSerializer(RegisterSerializer):
    name = serializers.CharField(max_length=150, required=False, allow_blank=True, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)

    def get_cleaned_data(self):
        return {
            "password1": self.validated_data.get("password1", ""),
            "email": self.validated_data.get("email", ""),
            "display_name": self.validated_data.get("name", "").strip(),
        }

    def validate_email(self, email):
        email = super().validate_email(email)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user is already registered with this e-mail address.")
        return email

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        user = adapter.save_user(request, user, self, commit=False)
        if "password1" in self.cleaned_data:
            try:
                adapter.clean_password(self.cleaned_data["password1"], user=user)
            except DjangoValidationError as exc:
                raise serializers.ValidationError(detail=serializers.as_serializer_error(exc)) from exc
        user.display_name = self.cleaned_data.get("display_name", "")
        user.save()
        self.custom_signup(request, user)
        setup_user_email(request, user, [])
        return user


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    profile_picture = serializers.SerializerMethodField()
    profile_picture_fallback_url = serializers.SerializerMethodField()

    def get_profile(self, instance: User) -> Profile | None:
        try:
            return instance.profile
        except Profile.DoesNotExist:
            return None

    def get_profile_picture(self, instance: User) -> str | None:
        profile = self.get_profile(instance)
        if profile is None:
            return None

        value = str(getattr(profile, "picture", "") or "").strip()
        return value or None

    def get_profile_picture_fallback_url(self, instance: User) -> str | None:
        profile = self.get_profile(instance)
        if profile is None:
            return None

        return profile.picture_fallback_url.strip() or None

    def to_representation(self, instance: User) -> dict:
        data = super().to_representation(instance)
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        can_view_email = bool(
            viewer
            and viewer.is_authenticated
            and (viewer.pk == instance.pk or viewer.is_staff or viewer.is_superuser)
        )
        if not can_view_email:
            data.pop("email", None)
        return data

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "profile_picture",
            "profile_picture_fallback_url",
            "is_active",
            "is_staff",
            "date_joined",
            "email_verified_at",
            "password_changed_at",
            "deactivated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "name",
            "email",
            "is_active",
            "is_staff",
            "date_joined",
            "email_verified_at",
            "password_changed_at",
            "deactivated_at",
            "created_at",
            "updated_at",
        )


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            "id",
            "user",
            "email_notifications_enabled",
            "in_app_notifications_enabled",
            "notify_on_follow",
            "notify_on_review_vote",
            "profile_public",
            "show_ratings_publicly",
            "personalized_recommendations_enabled",
            "external_enrichment_enabled",
            "search_history_enabled",
            "mature_content_enabled",
            "default_collection_privacy",
            "default_language",
            "timezone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "user", "created_at", "updated_at")


class ProfileInterestSerializer(serializers.ModelSerializer):
    genre = serializers.PrimaryKeyRelatedField(queryset=Genre.objects.all())
    genre_name = serializers.CharField(source="genre.name", read_only=True)

    class Meta:
        model = ProfileInterest
        fields = ["id", "genre", "genre_name", "weight", "created_at", "updated_at"]
        read_only_fields = ("id", "created_at", "updated_at")
        validators = []


class UserSocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSocialLink
        fields = ["id", "platform", "url", "label", "created_at", "updated_at"]
        read_only_fields = ("id", "created_at", "updated_at")
        validators = []


class ProfilePictureUploadSerializer(serializers.Serializer):
    picture = serializers.ImageField()


def profile_picture_url(profile: Profile) -> str | None:
    value = str(profile.picture or "").strip()
    return value or None


class ProfileSummarySerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    picture = serializers.SerializerMethodField()

    def get_picture(self, instance: Profile) -> str | None:
        return profile_picture_url(instance)

    class Meta:
        model = Profile
        fields = [
            "id",
            "name",
            "handle",
            "bio",
            "profile_type",
            "picture",
            "picture_fallback_url",
            "followers_count",
            "following_count",
            "reviews_count",
            "ratings_count",
            "books_read_count",
            "collections_count",
        ]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    picture = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    interest_links = ProfileInterestSerializer(many=True, read_only=True)
    social_links = UserSocialLinkSerializer(many=True, read_only=True)

    def get_picture(self, instance: Profile) -> str | None:
        return profile_picture_url(instance)

    class Meta:
        model = Profile
        fields = [
            "id",
            "name",
            "user",
            "handle",
            "bio",
            "profile_type",
            "picture",
            "picture_fallback_url",
            "location",
            "website_url",
            "interest_links",
            "social_links",
            "is_complete",
            "profile_completed_at",
            "completion_percent",
            "followers_count",
            "following_count",
            "reviews_count",
            "ratings_count",
            "books_read_count",
            "collections_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "name",
            "user",
            "followers_count",
            "following_count",
            "reviews_count",
            "ratings_count",
            "books_read_count",
            "collections_count",
            "created_at",
            "updated_at",
        )


class ProfileOverviewViewerContextSerializer(serializers.Serializer):
    is_self = serializers.BooleanField()
    is_following = serializers.BooleanField()
    can_view_private = serializers.BooleanField()


class ProfileOverviewStatsSerializer(serializers.Serializer):
    followers_count = serializers.IntegerField()
    following_count = serializers.IntegerField()
    reviews_count = serializers.IntegerField()
    ratings_count = serializers.IntegerField()
    collections_count = serializers.IntegerField()
    books_read_count = serializers.IntegerField()


class ProfileOverviewSerializer(serializers.Serializer):
    user = UserSerializer()
    profile = ProfileSerializer()
    viewer_context = ProfileOverviewViewerContextSerializer()
    stats = ProfileOverviewStatsSerializer()
    recent_reviews = ReviewSerializer(many=True)
    recent_ratings = RatingSerializer(many=True)
    recent_collections = ReadingCollectionSerializer(many=True)
