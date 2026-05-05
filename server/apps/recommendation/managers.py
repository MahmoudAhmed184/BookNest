from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models

if TYPE_CHECKING:
    from apps.recommendation.models import RecommendationModel, UserRecommendation  # noqa: F401


class RecommendationModelQuerySet(models.QuerySet["RecommendationModel"]):
    def active(self) -> RecommendationModelQuerySet:
        return self.filter(is_active=True)

    def of_type(self, model_type: str) -> RecommendationModelQuerySet:
        return self.filter(model_type=model_type)


class RecommendationModelManager(models.Manager["RecommendationModel"]):
    def get_queryset(self) -> RecommendationModelQuerySet:
        return RecommendationModelQuerySet(self.model, using=self._db)

    def active(self) -> RecommendationModelQuerySet:
        return self.get_queryset().active()

    def of_type(self, model_type: str) -> RecommendationModelQuerySet:
        return self.get_queryset().of_type(model_type)


class UserRecommendationQuerySet(models.QuerySet["UserRecommendation"]):
    def for_user(self, user: Any) -> UserRecommendationQuerySet:
        return self.filter(user=user)

    def with_related(self) -> UserRecommendationQuerySet:
        return self.select_related("user", "book", "model").prefetch_related("book__authors", "book__genres")


class UserRecommendationManager(models.Manager["UserRecommendation"]):
    def get_queryset(self) -> UserRecommendationQuerySet:
        return UserRecommendationQuerySet(self.model, using=self._db)

    def for_user(self, user: Any) -> UserRecommendationQuerySet:
        return self.get_queryset().for_user(user)

    def with_related(self) -> UserRecommendationQuerySet:
        return self.get_queryset().with_related()
