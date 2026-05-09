from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Q
from django.utils import timezone

from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationModel,
    RecommendationRun,
    UserRecommendation,
)

if TYPE_CHECKING:
    from django.db.models import QuerySet


def recommendation_models() -> QuerySet[RecommendationModel]:
    return RecommendationModel.objects.all()


def recommendation_runs() -> QuerySet[RecommendationRun]:
    return RecommendationRun.objects.select_related("model", "task_log", "requested_by")


def user_recommendations_for_user(*, user: Any) -> QuerySet[UserRecommendation]:
    return (
        UserRecommendation.objects.select_related("book", "model")
        .filter(
            user=user,
            is_active=True,
            is_dismissed=False,
        )
        .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
        .order_by("rank", "id")
    )


def catalog_recommendations(*, source: str | None = None) -> QuerySet[CatalogRecommendation]:
    queryset = CatalogRecommendation.objects.select_related("book").filter(is_active=True)
    if source:
        queryset = queryset.filter(source=source)
    return queryset.order_by("rank", "id")
