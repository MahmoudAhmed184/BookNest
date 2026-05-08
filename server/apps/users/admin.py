from django.contrib import admin

from apps.users.models import Profile, ProfileInterest, User, UserPreference, UserSocialLink


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "display_name", "is_active", "is_staff", "date_joined")
    search_fields = ("email", "display_name", "first_name", "last_name")
    list_filter = ("is_active", "is_staff")
    ordering = ("email",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("handle", "user", "profile_type", "is_complete", "followers_count")
    search_fields = ("handle", "user__email", "bio")
    list_filter = ("profile_type", "is_complete")


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "profile_public", "personalized_recommendations_enabled", "timezone")
    search_fields = ("user__email",)
    list_filter = ("profile_public", "personalized_recommendations_enabled")


@admin.register(ProfileInterest)
class ProfileInterestAdmin(admin.ModelAdmin):
    list_display = ("profile", "genre", "weight")
    search_fields = ("profile__handle", "genre__name")


@admin.register(UserSocialLink)
class UserSocialLinkAdmin(admin.ModelAdmin):
    list_display = ("profile", "platform", "label", "url")
    search_fields = ("profile__handle", "url", "label")
    list_filter = ("platform",)
