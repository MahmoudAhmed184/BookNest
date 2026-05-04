import logging
from dataclasses import dataclass
from math import sqrt
from typing import Any

import pandas as pd


logger = logging.getLogger(__name__)


@dataclass
class RatingPrediction:
    item_id: Any
    estimated_rating: float


class RecommendationEngine:
    """
    Pickleable recommendation engine that uses item popularity and average rating.

    The previous implementation depended on scikit-surprise, which does not build
    cleanly on Python 3.14. This class keeps the public API used by the service
    layer while relying only on pandas and the standard library.
    """

    def __init__(
        self,
        model_type: str = "svd",
        min_ratings_per_user: int = 5,
        rating_scale: tuple = (1, 5),
        item_id_col: str = "isbn13",
        user_id_col: str = "user_id",
        rating_col: str = "rate",
        svd_n_factors: int = 100,
        knn_k: int = 40,
        random_state: int = 42,
    ):
        self.model_type = model_type.lower()
        self.min_ratings_per_user = min_ratings_per_user
        self.rating_scale = rating_scale
        self.item_id_col = item_id_col
        self.user_id_col = user_id_col
        self.rating_col = rating_col
        self.svd_n_factors = svd_n_factors
        self.knn_k = knn_k
        self.random_state = random_state

        self.global_mean: float | None = None
        self.item_scores: dict[Any, float] = {}
        self.user_seen_items: dict[Any, set[Any]] = {}
        self.full_ratings_df: pd.DataFrame | None = None
        self.model = self

    def _filter_active_users(self, ratings_df: pd.DataFrame) -> pd.DataFrame:
        user_counts = ratings_df[self.user_id_col].value_counts()
        active_users = user_counts[user_counts >= self.min_ratings_per_user].index
        filtered_df = ratings_df[ratings_df[self.user_id_col].isin(active_users)]

        if filtered_df.empty:
            logger.warning("No ratings remain after filtering active users.")
        return filtered_df

    def _fit_scores(self, ratings_df: pd.DataFrame) -> None:
        self.global_mean = float(ratings_df[self.rating_col].mean())
        item_stats = ratings_df.groupby(self.item_id_col)[self.rating_col].agg(["mean", "count"])

        # Bayesian smoothing keeps very sparse items from outranking established ones.
        smoothing = max(float(item_stats["count"].median()), 1.0)
        self.item_scores = {
            item_id: float(
                ((row["mean"] * row["count"]) + (self.global_mean * smoothing))
                / (row["count"] + smoothing)
            )
            for item_id, row in item_stats.iterrows()
        }
        self.user_seen_items = (
            ratings_df.groupby(self.user_id_col)[self.item_id_col]
            .apply(lambda values: set(values))
            .to_dict()
        )

    def _predict(self, item_id: Any) -> float:
        if self.global_mean is None:
            return 0.0
        return self.item_scores.get(item_id, self.global_mean)

    def _evaluate(self, test_df: pd.DataFrame) -> dict[str, float | None]:
        if test_df.empty:
            return {"rmse": None, "mae": None}

        errors = [
            float(row[self.rating_col]) - self._predict(row[self.item_id_col])
            for _, row in test_df.iterrows()
        ]
        mae = sum(abs(error) for error in errors) / len(errors)
        rmse = sqrt(sum(error * error for error in errors) / len(errors))
        return {"rmse": rmse, "mae": mae}

    def train(self, ratings_df: pd.DataFrame, test_size: float = 0.2) -> dict | None:
        if not isinstance(ratings_df, pd.DataFrame):
            logger.error("ratings_df must be a pandas DataFrame.")
            return None

        required_columns = [self.user_id_col, self.item_id_col, self.rating_col]
        if not all(col in ratings_df.columns for col in required_columns):
            logger.error("ratings_df must contain columns: %s", ", ".join(required_columns))
            return None

        self.full_ratings_df = ratings_df.copy()
        filtered_ratings = self._filter_active_users(self.full_ratings_df)
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
        return self._evaluate(test_df)

    def recommend_for_user(
        self, user_id: object, n_recommendations: int = 10
    ) -> list[tuple[object, float]]:
        if self.global_mean is None or not self.item_scores:
            logger.error("Model has not been trained. Call train() first.")
            return []

        seen_items = self.user_seen_items.get(user_id, set())
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
