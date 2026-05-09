from __future__ import annotations

import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.recommendations import services
from apps.recommendations.models import RecommendationRun
from apps.recommendations.tasks import enqueue_recommendation_run
from apps.reviews.models import Rating

logger = logging.getLogger(__name__)

RETRAIN_RATING_INTERVAL = 5


def _recommendations_enabled(user) -> bool:
    try:
        return bool(user.preferences.personalized_recommendations_enabled)
    except AttributeError:
        return True


@receiver(post_save, sender=Rating)
def trigger_recommendations_after_rating(sender, instance: Rating, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived or not _recommendations_enabled(instance.user):
        return

    rating_count = Rating.objects.filter(user=instance.user, is_archived=False).count()
    if rating_count < services.DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS:
        return

    should_retrain = (
        rating_count == services.DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS
        or rating_count % RETRAIN_RATING_INTERVAL == 0
    )

    def enqueue() -> None:
        pending_exists = RecommendationRun.objects.filter(
            run_type=RecommendationRun.RunType.GENERATE,
            status__in=[RecommendationRun.Status.PENDING, RecommendationRun.Status.RUNNING],
            parameters__user_id=instance.user_id,
        ).exists()
        if pending_exists:
            return

        run = RecommendationRun.objects.create(
            requested_by=instance.user,
            run_type=RecommendationRun.RunType.GENERATE,
            status=RecommendationRun.Status.PENDING,
            parameters={
                "user_id": instance.user_id,
                "n_recommendations": services.DEFAULT_RECOMMENDATION_COUNT,
                "min_ratings": services.DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
                "train_if_missing": True,
                "force_train": should_retrain,
                "trigger": "rating_created",
                "rating_count": rating_count,
            },
        )
        try:
            enqueue_recommendation_run(run=run)
        except Exception as exc:
            logger.warning("Could not enqueue recommendation run %s after rating: %s", run.pk, exc)

    transaction.on_commit(enqueue)
