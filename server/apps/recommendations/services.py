from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction
from django.utils import timezone

from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationFeedback,
    RecommendationModel,
    UserRecommendation,
)

if TYPE_CHECKING:
    from apps.books.models import Book


@transaction.atomic
def dismiss_recommendation(*, recommendation: UserRecommendation) -> UserRecommendation:
    recommendation.is_dismissed = True
    recommendation.is_active = False
    recommendation.save(update_fields=["is_dismissed", "is_active", "updated_at"])
    RecommendationFeedback.objects.get_or_create(
        user=recommendation.user,
        book=recommendation.book,
        feedback_type=RecommendationFeedback.FeedbackType.DISMISSED,
        defaults={"recommendation": recommendation},
    )
    return recommendation


def mark_recommendation_clicked(*, recommendation: UserRecommendation) -> UserRecommendation:
    recommendation.clicked_at = timezone.now()
    recommendation.save(update_fields=["clicked_at", "updated_at"])
    RecommendationFeedback.objects.get_or_create(
        user=recommendation.user,
        book=recommendation.book,
        feedback_type=RecommendationFeedback.FeedbackType.CLICKED,
        defaults={"recommendation": recommendation},
    )
    return recommendation


@transaction.atomic
def replace_catalog_recommendations(
    *,
    source: str,
    ranked_books: list[tuple[Book, int, float]],
) -> list[CatalogRecommendation]:
    CatalogRecommendation.objects.filter(source=source, is_active=True).update(is_active=False)
    return [
        CatalogRecommendation.objects.create(book=book, source=source, rank=rank, score=score)
        for book, rank, score in ranked_books
    ]


@transaction.atomic
def set_active_model(*, model: RecommendationModel) -> RecommendationModel:
    model.is_active = True
    model.save(update_fields=["is_active", "updated_at"])
    return model
