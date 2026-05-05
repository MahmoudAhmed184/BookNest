import logging
import socket
from typing import Any
from urllib.parse import urlparse

from celery import shared_task
from django.conf import settings
from django.db import DatabaseError

from .services import RecommendationService

logger = logging.getLogger(__name__)

TASK_HANDLED_ERRORS = (DatabaseError, OSError, RuntimeError, TypeError, ValueError)


def _celery_broker_is_reachable(timeout: float = 0.2) -> bool:
    broker_url = getattr(settings, "CELERY_BROKER_URL", "")
    parsed_url = urlparse(broker_url)

    if parsed_url.scheme not in {"redis", "rediss"}:
        return True

    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or 6379

    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@shared_task
def train_recommendation_model_task(
    model_type: str = "svd", min_ratings_per_user: int = 5, n_factors: int = 100, knn_k: int = 40
) -> str:
    """
    Background task for training a recommendation model
    """
    logger.info(f"Starting background task for training {model_type} model")
    try:
        model_record = RecommendationService.train_recommendation_model(
            model_type=model_type, min_ratings_per_user=min_ratings_per_user, n_factors=n_factors, knn_k=knn_k
        )
        return f"Successfully trained model ID: {model_record.id}" if model_record else "Model training failed"
    except TASK_HANDLED_ERRORS as exc:
        logger.error("Error in train_recommendation_model_task: %s", exc)
        return f"Error training model: {exc}"


@shared_task
def generate_recommendations_for_user_task(
    user_id: int, n_recommendations: int = 10, model_id: int | None = None
) -> str:
    """
    Background task for generating recommendations for a single user
    """
    logger.info(f"Starting background task for generating recommendations for user {user_id}")
    try:
        recs = RecommendationService.generate_recommendations_for_user(
            user_id=user_id, n_recommendations=n_recommendations, model_id=model_id
        )
        return f"Generated {len(recs)} recommendations for user {user_id}"
    except TASK_HANDLED_ERRORS as exc:
        logger.error("Error in generate_recommendations_for_user_task: %s", exc)
        return f"Error generating recommendations: {exc}"


def enqueue_generate_recommendations_for_user(
    user_id: int, n_recommendations: int = 10, model_id: int | None = None
) -> Any:
    if not getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False) and not _celery_broker_is_reachable():
        raise ConnectionError("Celery broker is not reachable")

    return generate_recommendations_for_user_task.apply_async(
        kwargs={
            "user_id": user_id,
            "n_recommendations": n_recommendations,
            "model_id": model_id,
        },
        retry=False,
    )


@shared_task
def generate_recommendations_for_all_users_task(
    n_recommendations: int = 10, model_id: int | None = None, min_ratings: int = 3
) -> str:
    """
    Background task for generating recommendations for all eligible users
    """
    logger.info("Starting background task for generating recommendations for all users")
    try:
        count = RecommendationService.generate_recommendations_for_all_users(
            n_recommendations=n_recommendations, model_id=model_id, min_ratings=min_ratings
        )
        return f"Generated recommendations for multiple users, total count: {count}"
    except TASK_HANDLED_ERRORS as exc:
        logger.error("Error in generate_recommendations_for_all_users_task: %s", exc)
        return f"Error generating recommendations for all users: {exc}"
