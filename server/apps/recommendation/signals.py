import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.books.models import BookRating
from apps.recommendation.services import (
    DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
    RecommendationService,
)

logger = logging.getLogger(__name__)

RETRAIN_RATING_INTERVAL = 5


@receiver(post_save, sender=BookRating)
def trigger_recommendations_after_rating(sender, instance, **kwargs):
    user = instance.user
    user_rating_count = BookRating.objects.filter(user=user).count()

    if user_rating_count < DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS:
        return

    model_id = None
    should_retrain = (
        user_rating_count == DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS
        or user_rating_count % RETRAIN_RATING_INTERVAL == 0
    )

    if should_retrain:
        model_record = RecommendationService.train_recommendation_model(
            min_ratings_per_user=DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
        )
        model_id = model_record.id if model_record else None

    try:
        from apps.recommendation.tasks import enqueue_generate_recommendations_for_user

        task = enqueue_generate_recommendations_for_user(
            user_id=user.id,
            model_id=model_id,
            n_recommendations=10,
        )
        logger.info(
            "Recommendation generation task started for user %s: task %s",
            user.id,
            task.id,
        )
    except Exception as exc:
        logger.warning(
            "Could not enqueue recommendation generation for user %s; running synchronously: %s",
            user.id,
            exc,
        )
        recommendations = RecommendationService.generate_recommendations_for_user(
            user_id=user.id,
            model_id=model_id,
            n_recommendations=10,
            min_ratings_per_user=DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
        )
        logger.info(
            "Generated %s recommendations synchronously for user %s.",
            len(recommendations),
            user.id,
        )
