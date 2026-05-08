from __future__ import annotations

import logging
from dataclasses import dataclass
from math import sqrt
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import pandas as pd

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RatingPrediction:
    item_id: int
    estimated_rating: float


class RecommendationEngine:
    """
    Small, pickleable recommendation engine based on Bayesian-smoothed item scores.

    It preserves the old app's public behavior without depending on native ML packages
    that are brittle on the current Python/Django stack.
    """

    def __init__(
        self,
        *,
        model_type: str = "hybrid",
        min_ratings_per_user: int = 5,
        rating_scale: tuple[int, int] = (1, 5),
        item_id_col: str = "book_id",
        user_id_col: str = "user_id",
        rating_col: str = "rating",
        random_state: int = 42,
    ) -> None:
        self.model_type = model_type.lower()
        self.min_ratings_per_user = min_ratings_per_user
        self.rating_scale = rating_scale
        self.item_id_col = item_id_col
        self.user_id_col = user_id_col
        self.rating_col = rating_col
        self.random_state = random_state

        self.global_mean: float | None = None
        self.item_scores: dict[int, float] = {}
        self.user_seen_items: dict[int, set[int]] = {}

    def _filter_active_users(self, ratings_df: pd.DataFrame) -> pd.DataFrame:
        user_counts = ratings_df[self.user_id_col].value_counts()
        active_users = user_counts[user_counts >= self.min_ratings_per_user].index
        filtered_df = ratings_df[ratings_df[self.user_id_col].isin(active_users)]

        if filtered_df.empty:
            logger.info("No ratings remain after filtering users by minimum rating count.")
        return filtered_df

    def _fit_scores(self, ratings_df: pd.DataFrame) -> None:
        self.global_mean = float(ratings_df[self.rating_col].mean())
        item_stats = ratings_df.groupby(self.item_id_col)[self.rating_col].agg(["mean", "count"])
        smoothing = max(float(item_stats["count"].median()), 1.0)

        self.item_scores = {
            int(item_id): float(
                ((row["mean"] * row["count"]) + (self.global_mean * smoothing)) / (row["count"] + smoothing)
            )
            for item_id, row in item_stats.iterrows()
        }
        self.user_seen_items = {
            int(user_id): {int(item_id) for item_id in values}
            for user_id, values in ratings_df.groupby(self.user_id_col)[self.item_id_col]
        }

    def _predict(self, item_id: Any) -> float:
        if self.global_mean is None:
            return 0.0
        return self.item_scores.get(int(item_id), self.global_mean)

    def _evaluate(self, test_df: pd.DataFrame) -> dict[str, float | None]:
        if test_df.empty:
            return {"rmse": None, "mae": None}

        errors = [float(row[self.rating_col]) - self._predict(row[self.item_id_col]) for _, row in test_df.iterrows()]
        mae = sum(abs(error) for error in errors) / len(errors)
        rmse = sqrt(sum(error * error for error in errors) / len(errors))
        return {"rmse": rmse, "mae": mae}

    def train(self, ratings_df: pd.DataFrame, *, test_size: float = 0.2) -> dict[str, float | None] | None:
        required_columns = {self.user_id_col, self.item_id_col, self.rating_col}
        if not required_columns.issubset(ratings_df.columns):
            logger.error("ratings_df must contain columns: %s", ", ".join(sorted(required_columns)))
            return None

        filtered_ratings = self._filter_active_users(ratings_df.copy())
        if filtered_ratings.empty:
            return None

        if 0 < test_size < 1 and len(filtered_ratings) > 1:
            test_df = filtered_ratings.sample(frac=test_size, random_state=self.random_state)
            train_df = filtered_ratings.drop(test_df.index)
            if train_df.empty:
                train_df = filtered_ratings
                test_df = filtered_ratings.iloc[0:0]
        else:
            train_df = filtered_ratings
            test_df = filtered_ratings.iloc[0:0]

        self._fit_scores(train_df)
        self.user_seen_items = {
            int(user_id): {int(item_id) for item_id in values}
            for user_id, values in ratings_df.groupby(self.user_id_col)[self.item_id_col]
        }
        return self._evaluate(test_df)

    def recommend_for_user(self, user_id: int, *, n_recommendations: int = 10) -> list[tuple[int, float]]:
        if self.global_mean is None or not self.item_scores:
            logger.info("Recommendation model has not been trained.")
            return []

        seen_items = self.user_seen_items.get(int(user_id), set())
        recommendations = [
            RatingPrediction(item_id=item_id, estimated_rating=score)
            for item_id, score in self.item_scores.items()
            if item_id not in seen_items
        ]
        recommendations.sort(key=lambda prediction: prediction.estimated_rating, reverse=True)
        return [
            (prediction.item_id, prediction.estimated_rating)
            for prediction in recommendations[:n_recommendations]
        ]
