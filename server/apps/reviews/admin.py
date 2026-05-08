from django.contrib import admin

from apps.reviews.models import Rating, Review, ReviewVote


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "value", "rated_at", "is_archived")
    search_fields = ("user__email", "book__title")
    list_filter = ("value", "is_archived")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "title", "score", "reviewed_at", "is_archived")
    search_fields = ("user__email", "book__title", "title", "body")
    list_filter = ("contains_spoilers", "is_archived")


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "review", "vote_type", "created_at")
    search_fields = ("user__email", "review__book__title")
    list_filter = ("vote_type",)
