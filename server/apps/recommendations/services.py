from __future__ import annotations

import logging
import pickle
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pandas as pd
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import DatabaseError, transaction
from django.db.models import Count
from django.utils import timezone

from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationFeedback,
    RecommendationModel,
    RecommendationRun,
    UserRecommendation,
)
from apps.recommendations.recommendation_engine import RecommendationEngine

if TYPE_CHECKING:
    from apps.books.models import Book

logger = logging.getLogger(__name__)

DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS = 3
DEFAULT_RECOMMENDATION_COUNT = 10
DEFAULT_RECOMMENDATION_TTL_DAYS = 14
FALLBACK_MODEL_VERSION = "system-popularity-v1"
CATALOG_REFRESH_LIMIT = 50
SCORE_QUANT = Decimal("0.000001")


def _score_decimal(value: float | Decimal | int | None) -> Decimal:
    if value is None:
        return Decimal("0").quantize(SCORE_QUANT)
    return max(Decimal("0"), Decimal(str(value))).quantize(SCORE_QUANT, rounding=ROUND_HALF_UP)


def _model_metric(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal("0.00001"), rounding=ROUND_HALF_UP)


def _artifact_path(artifact_uri: str) -> Path:
    return Path(settings.MEDIA_ROOT) / artifact_uri


def _preference_enabled(*, user: Any) -> bool:
    try:
        return bool(user.preferences.personalized_recommendations_enabled)
    except AttributeError:
        return True


def _visible_books_queryset():
    from apps.books.models import Book

    return Book.objects.visible()


def get_ratings_dataframe() -> pd.DataFrame:
    from apps.reviews.models import Rating

    rows = Rating.objects.filter(is_archived=False).values("user_id", "book_id", "value")
    return pd.DataFrame(
        [{"user_id": row["user_id"], "book_id": row["book_id"], "rating": float(row["value"])} for row in rows]
    )


def save_model_artifact(*, engine: RecommendationEngine, model_type: str) -> str:
    model_filename = f"{model_type}_{datetime.now(tz=timezone.get_current_timezone()).strftime('%Y%m%d_%H%M%S')}.pkl"
    artifact_uri = f"recommendation_models/{model_filename}"
    model_path = _artifact_path(artifact_uri)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model_path.write_bytes(pickle.dumps(engine))
    return artifact_uri


@transaction.atomic
def fallback_recommendation_model() -> RecommendationModel:
    model, _created = RecommendationModel.objects.get_or_create(
        model_type=RecommendationModel.ModelType.POPULARITY,
        version=FALLBACK_MODEL_VERSION,
        defaults={
            "name": "Popularity fallback",
            "is_active": False,
            "min_ratings_threshold": 0,
            "training_sample_size": 0,
            "metrics": {"strategy": "catalog_popularity"},
        },
    )
    return model


@transaction.atomic
def train_recommendation_model(
    *,
    model_type: str = RecommendationModel.ModelType.HYBRID,
    min_ratings_per_user: int = DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
    version: str | None = None,
) -> RecommendationModel | None:
    ratings_df = get_ratings_dataframe()
    if ratings_df.empty:
        logger.info("No ratings data is available for recommendation training.")
        return None

    engine = RecommendationEngine(model_type=model_type, min_ratings_per_user=min_ratings_per_user)
    eval_metrics = engine.train(ratings_df, test_size=0.2)
    if eval_metrics is None:
        logger.info("Recommendation training produced no model.")
        return None

    artifact_uri = save_model_artifact(engine=engine, model_type=model_type)
    generated_at = timezone.now()
    model_version = version or generated_at.strftime("%Y%m%d%H%M%S")

    model = RecommendationModel(
        name=f"{model_type.upper()} recommendations {model_version}",
        version=model_version,
        model_type=model_type,
        is_active=True,
        rmse=_model_metric(eval_metrics.get("rmse")),
        mae=_model_metric(eval_metrics.get("mae")),
        min_ratings_threshold=min_ratings_per_user,
        generated_at=generated_at,
        training_sample_size=len(ratings_df),
        artifact_uri=artifact_uri,
        metrics={
            "rmse": eval_metrics.get("rmse"),
            "mae": eval_metrics.get("mae"),
            "rating_count": len(ratings_df),
            "user_count": int(ratings_df["user_id"].nunique()),
            "book_count": int(ratings_df["book_id"].nunique()),
        },
    )
    model.full_clean()
    model.save()
    logger.info("Trained recommendation model %s", model.pk)
    return model


def load_recommendation_model(
    *,
    model_id: int | None = None,
) -> tuple[RecommendationEngine, RecommendationModel] | None:
    try:
        model: RecommendationModel | None
        if model_id:
            model = RecommendationModel.objects.get(pk=model_id)
        else:
            model = RecommendationModel.objects.filter(is_active=True).exclude(artifact_uri="").first()
        if model is None or not model.artifact_uri:
            return None

        model_path = _artifact_path(model.artifact_uri)
        if not model_path.exists():
            logger.warning("Recommendation artifact is missing: %s", model_path)
            return None

        with model_path.open("rb") as artifact:
            engine = pickle.load(artifact)
        if not isinstance(engine, RecommendationEngine):
            logger.warning("Recommendation artifact %s has unexpected type.", model_path)
            return None
        return engine, model
    except (
        RecommendationModel.DoesNotExist,
        DatabaseError,
        EOFError,
        OSError,
        pickle.PickleError,
        TypeError,
        ValueError,
    ) as exc:
        logger.warning("Could not load recommendation model: %s", exc)
        return None


def _try_train_recommendation_model(*, min_ratings_per_user: int) -> RecommendationModel | None:
    try:
        return train_recommendation_model(min_ratings_per_user=min_ratings_per_user)
    except (OSError, pickle.PickleError) as exc:
        logger.warning("Could not train recommendation model; using fallback recommendations: %s", exc)
        return None


def seen_book_ids_for_user(*, user_id: int) -> set[int]:
    from apps.collections.models import CollectionBook, ReadingProgress
    from apps.reviews.models import Rating

    rating_ids = (
        Rating.objects.filter(user_id=user_id, is_archived=False).order_by().values_list("book_id", flat=True)
    )
    progress_ids = (
        ReadingProgress.objects.filter(user_id=user_id, is_archived=False).order_by().values_list("book_id", flat=True)
    )
    collection_ids = (
        CollectionBook.objects.filter(
            collection__owner_id=user_id,
            is_archived=False,
            collection__is_archived=False,
        )
        .order_by()
        .values_list("book_id", flat=True)
    )
    return {int(book_id) for book_id in rating_ids.union(progress_ids, collection_ids)}


def catalog_fallback_candidates(
    *,
    user_id: int,
    n_recommendations: int = DEFAULT_RECOMMENDATION_COUNT,
    exclude_book_ids: set[int] | None = None,
) -> list[tuple[int, float]]:
    seen_ids = seen_book_ids_for_user(user_id=user_id)
    if exclude_book_ids:
        seen_ids.update(exclude_book_ids)

    books = (
        _visible_books_queryset()
        .exclude(id__in=seen_ids)
        .order_by("-trending_score", "-popularity_score", "-average_rating", "-rating_count", "title")[
            :n_recommendations
        ]
    )

    candidates: list[tuple[int, float]] = []
    for book in books:
        score = book.trending_score or book.popularity_score or book.average_rating or 0
        candidates.append((book.id, float(score)))
    return candidates


def _recommendation_candidates(
    *,
    user: Any,
    n_recommendations: int,
    model_id: int | None,
    train_if_missing: bool,
    min_ratings_per_user: int,
    force_train: bool = False,
) -> tuple[RecommendationModel, list[tuple[int, float]], str, dict[str, Any]]:
    model_record: RecommendationModel | None = None
    source = UserRecommendation.Source.PERSONALIZED
    reason: dict[str, Any] = {"strategy": "personalized"}
    candidates: list[tuple[int, float]] = []
    attempted_training = False

    if _preference_enabled(user=user):
        if force_train:
            attempted_training = True
            model_record = _try_train_recommendation_model(min_ratings_per_user=min_ratings_per_user)
            if model_record:
                model_id = model_record.id
        model_data = load_recommendation_model(model_id=model_id)
        if not model_data and train_if_missing and not attempted_training:
            model_record = _try_train_recommendation_model(min_ratings_per_user=min_ratings_per_user)
            if model_record:
                model_data = load_recommendation_model(model_id=model_record.id)

        if model_data:
            engine, model_record = model_data
            candidates = engine.recommend_for_user(user.id, n_recommendations=n_recommendations)
            reason = {"strategy": "personalized", "model_id": model_record.id, "model_type": model_record.model_type}

    if candidates:
        candidate_book_ids = {book_id for book_id, _score in candidates}
        if len(candidates) < n_recommendations:
            candidates.extend(
                catalog_fallback_candidates(
                    user_id=user.id,
                    n_recommendations=n_recommendations - len(candidates),
                    exclude_book_ids=candidate_book_ids,
                )
            )
    else:
        model_record = fallback_recommendation_model()
        source = UserRecommendation.Source.FALLBACK
        reason = {"strategy": "catalog_fallback"}
        candidates = catalog_fallback_candidates(user_id=user.id, n_recommendations=n_recommendations)

    if model_record is None:
        model_record = fallback_recommendation_model()

    return model_record, candidates[:n_recommendations], source, reason


@transaction.atomic
def generate_recommendations_for_user(
    *,
    user: Any,
    n_recommendations: int = DEFAULT_RECOMMENDATION_COUNT,
    model_id: int | None = None,
    train_if_missing: bool = True,
    min_ratings_per_user: int = DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
    ttl_days: int = DEFAULT_RECOMMENDATION_TTL_DAYS,
    force_train: bool = False,
) -> list[UserRecommendation]:
    n_recommendations = max(1, min(int(n_recommendations), 100))
    model_record, candidates, source, reason = _recommendation_candidates(
        user=user,
        n_recommendations=n_recommendations,
        model_id=model_id,
        train_if_missing=train_if_missing,
        min_ratings_per_user=min_ratings_per_user,
        force_train=force_train,
    )
    if not candidates:
        UserRecommendation.objects.filter(user=user).delete()
        return []

    candidate_book_ids = [book_id for book_id, _ in candidates]
    books_by_id = {
        book.id: book
        for book in _visible_books_queryset().filter(id__in=candidate_book_ids)
    }
    now = timezone.now()
    expires_at = now + timedelta(days=max(1, ttl_days))

    UserRecommendation.objects.filter(user=user).delete()
    recommendations = [
        UserRecommendation(
            user=user,
            book=books_by_id[book_id],
            model=model_record,
            source=source,
            rank=rank,
            score=_score_decimal(score),
            reason=reason,
            generated_at=now,
            expires_at=expires_at,
        )
        for rank, (book_id, score) in enumerate(candidates, 1)
        if book_id in books_by_id
    ]
    UserRecommendation.objects.bulk_create(recommendations)
    logger.info("Generated %s recommendations for user %s", len(recommendations), user.pk)
    return recommendations


def generate_recommendations_for_all_users(
    *,
    n_recommendations: int = DEFAULT_RECOMMENDATION_COUNT,
    model_id: int | None = None,
    min_ratings: int = DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
    train_if_missing: bool = True,
    force_train: bool = False,
) -> int:
    from apps.reviews.models import Rating

    user_model = get_user_model()
    eligible_user_ids = (
        Rating.objects.filter(is_archived=False, user__is_active=True)
        .values("user_id")
        .annotate(rating_count=Count("id"))
        .filter(rating_count__gte=min_ratings)
        .values_list("user_id", flat=True)
    )

    total = 0
    for user in user_model.objects.filter(id__in=eligible_user_ids):
        total += len(
            generate_recommendations_for_user(
                user=user,
                n_recommendations=n_recommendations,
                model_id=model_id,
                train_if_missing=train_if_missing,
                min_ratings_per_user=min_ratings,
                force_train=force_train,
            )
        )
    return total


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
        CatalogRecommendation.objects.create(
            book=book,
            source=source,
            rank=rank,
            score=_score_decimal(score),
            reason={"strategy": source},
        )
        for book, rank, score in ranked_books
    ]


def refresh_catalog_recommendations(
    *,
    source: str = CatalogRecommendation.Source.TRENDING,
    limit: int = CATALOG_REFRESH_LIMIT,
) -> list[CatalogRecommendation]:
    books = _visible_books_queryset().order_by(
        "-trending_score",
        "-popularity_score",
        "-average_rating",
        "-rating_count",
        "title",
    )[: max(1, min(limit, 100))]
    ranked_books = [
        (book, rank, float(book.trending_score or book.popularity_score or book.average_rating or 0))
        for rank, book in enumerate(books, 1)
    ]
    return replace_catalog_recommendations(source=source, ranked_books=ranked_books)


def execute_recommendation_run(*, run: RecommendationRun) -> int:
    parameters = run.parameters or {}
    run.status = RecommendationRun.Status.RUNNING
    run.started_at = run.started_at or timezone.now()
    run.error_message = ""
    run.save(update_fields=["status", "started_at", "error_message", "updated_at"])

    task_log = run.task_log if run.task_log_id else None
    if task_log is not None:
        task_log.status = task_log.Status.RUNNING
        task_log.save(update_fields=["status", "updated_at"])

    try:
        affected = 0
        if run.run_type == RecommendationRun.RunType.TRAIN:
            model = train_recommendation_model(
                model_type=parameters.get("model_type", RecommendationModel.ModelType.HYBRID),
                min_ratings_per_user=int(
                    parameters.get("min_ratings", DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS)
                ),
            )
            affected = 1 if model else 0
        elif run.run_type == RecommendationRun.RunType.GENERATE:
            affected = _execute_generation_parameters(run=run, parameters=parameters)
        elif run.run_type == RecommendationRun.RunType.REFRESH:
            source = parameters.get("source", CatalogRecommendation.Source.TRENDING)
            limit = int(parameters.get("limit", CATALOG_REFRESH_LIMIT))
            affected = len(refresh_catalog_recommendations(source=source, limit=limit))
            affected += _execute_generation_parameters(run=run, parameters=parameters)

        run.status = RecommendationRun.Status.SUCCESS
        run.finished_at = timezone.now()
        run.parameters = {**parameters, "affected_count": affected}
        run.save(update_fields=["status", "finished_at", "parameters", "updated_at"])

        if task_log is not None:
            task_log.status = task_log.Status.SUCCESS
            task_log.finished_at = run.finished_at
            task_log.save(update_fields=["status", "finished_at", "updated_at"])
        _notify_recommendation_run_success(run=run, affected=affected)
        return affected
    except Exception as exc:
        run.status = RecommendationRun.Status.FAILURE
        run.finished_at = timezone.now()
        run.error_message = str(exc)
        run.save(update_fields=["status", "finished_at", "error_message", "updated_at"])
        if task_log is not None:
            task_log.status = task_log.Status.FAILURE
            task_log.finished_at = run.finished_at
            task_log.error_message = str(exc)
            task_log.save(update_fields=["status", "finished_at", "error_message", "updated_at"])
        raise


def _execute_generation_parameters(*, run: RecommendationRun, parameters: dict[str, Any]) -> int:
    user_model = get_user_model()
    n_recommendations = int(parameters.get("n_recommendations", DEFAULT_RECOMMENDATION_COUNT))
    min_ratings = int(parameters.get("min_ratings", DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS))
    model_id = run.model_id or parameters.get("model_id")
    user_id = parameters.get("user_id")
    train_if_missing = bool(parameters.get("train_if_missing", True))
    force_train = bool(parameters.get("force_train", False))

    if user_id:
        user = user_model.objects.get(pk=user_id)
        return len(
            generate_recommendations_for_user(
                user=user,
                n_recommendations=n_recommendations,
                model_id=model_id,
                train_if_missing=train_if_missing,
                min_ratings_per_user=min_ratings,
                force_train=force_train,
            )
        )

    return generate_recommendations_for_all_users(
        n_recommendations=n_recommendations,
        model_id=model_id,
        min_ratings=min_ratings,
        train_if_missing=train_if_missing,
        force_train=force_train,
    )


def _notify_recommendation_run_success(*, run: RecommendationRun, affected: int) -> None:
    user_id = (run.parameters or {}).get("user_id")
    if not user_id or affected <= 0:
        return
    try:
        user = get_user_model().objects.get(pk=user_id)
        if not getattr(user.preferences, "in_app_notifications_enabled", True):
            return
        from apps.notifications.models import Notification
        from apps.notifications.services import create_notification

        create_notification(
            recipient=user,
            notification_type=Notification.NotificationType.RECOMMENDATION,
            action=Notification.Action.RECOMMENDATION_READY,
            target=run,
            payload={"run_id": run.id, "affected_count": affected},
        )
    except Exception as exc:
        logger.warning("Could not create recommendation-ready notification for run %s: %s", run.pk, exc)
