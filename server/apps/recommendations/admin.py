from django.contrib import admin

from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationFeedback,
    RecommendationModel,
    RecommendationRun,
    UserRecommendation,
)


@admin.register(RecommendationModel)
class RecommendationModelAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "model_type", "is_active", "generated_at")
    search_fields = ("name", "version")
    list_filter = ("model_type", "is_active")


@admin.register(RecommendationRun)
class RecommendationRunAdmin(admin.ModelAdmin):
    list_display = ("run_type", "status", "model", "started_at", "finished_at")
    search_fields = ("error_message",)
    list_filter = ("run_type", "status")


@admin.register(UserRecommendation)
class UserRecommendationAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "model", "source", "rank", "score", "is_active")
    search_fields = ("user__email", "book__title", "model__name")
    list_filter = ("source", "is_active", "is_dismissed")


@admin.register(CatalogRecommendation)
class CatalogRecommendationAdmin(admin.ModelAdmin):
    list_display = ("source", "rank", "book", "score", "generated_at", "is_active")
    search_fields = ("book__title",)
    list_filter = ("source", "is_active")


@admin.register(RecommendationFeedback)
class RecommendationFeedbackAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "feedback_type", "created_at")
    search_fields = ("user__email", "book__title")
    list_filter = ("feedback_type",)
