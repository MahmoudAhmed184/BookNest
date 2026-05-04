from django.shortcuts import get_object_or_404

from apps.books.models import BookRating
from apps.recommendation.models import RecommendationModel, UserRecommendation


def recommendation_models():
    return RecommendationModel.objects.all()


def active_recommendation_model(model_id=None):
    if model_id:
        return get_object_or_404(RecommendationModel, id=model_id)
    return RecommendationModel.objects.active().first()


def user_recommendations(user):
    return UserRecommendation.objects.with_related().for_user(user)


def rating_count_for_user(user):
    return BookRating.objects.filter(user=user).count()
