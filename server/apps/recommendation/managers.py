from django.db import models


class RecommendationModelQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def of_type(self, model_type):
        return self.filter(model_type=model_type)


class RecommendationModelManager(models.Manager.from_queryset(RecommendationModelQuerySet)):
    pass


class UserRecommendationQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user)

    def with_related(self):
        return self.select_related('user', 'book', 'model').prefetch_related('book__authors', 'book__genres')


class UserRecommendationManager(models.Manager.from_queryset(UserRecommendationQuerySet)):
    pass
