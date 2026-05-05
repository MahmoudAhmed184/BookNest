from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.shortcuts import get_object_or_404

from apps.books.models import BookRating
from apps.recommendation.models import RecommendationModel, UserRecommendation

if TYPE_CHECKING:
    from django.db.models import QuerySet


def recommendation_models() -> QuerySet[RecommendationModel]:
    return RecommendationModel.objects.all()


def active_recommendation_model(*, model_id: int | None = None) -> RecommendationModel | None:
    if model_id:
        return get_object_or_404(RecommendationModel, id=model_id)
    return RecommendationModel.objects.active().first()


def user_recommendations(*, user: Any) -> QuerySet[UserRecommendation]:
    return UserRecommendation.objects.with_related().for_user(user)


def rating_count_for_user(*, user: Any) -> int:
    return BookRating.objects.filter(user=user).count()
