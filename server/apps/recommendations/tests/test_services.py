from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pandas as pd
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase, override_settings

from apps.books.models import Book
from apps.recommendations import services
from apps.recommendations.recommendation_engine import RecommendationEngine
from apps.reviews.models import Rating


class RecommendationEngineTests(SimpleTestCase):
    def test_engine_excludes_items_seen_by_user(self) -> None:
        engine = RecommendationEngine(min_ratings_per_user=2)
        ratings_df = pd.DataFrame(
            [
                {"user_id": 1, "book_id": 1, "rating": 5.0},
                {"user_id": 1, "book_id": 2, "rating": 4.0},
                {"user_id": 2, "book_id": 1, "rating": 5.0},
                {"user_id": 2, "book_id": 3, "rating": 5.0},
                {"user_id": 3, "book_id": 3, "rating": 4.0},
                {"user_id": 3, "book_id": 4, "rating": 5.0},
            ]
        )

        self.assertIsNotNone(engine.train(ratings_df, test_size=0))

        recommended_ids = {book_id for book_id, _score in engine.recommend_for_user(1, n_recommendations=10)}
        self.assertNotIn(1, recommended_ids)
        self.assertNotIn(2, recommended_ids)

    def test_model_artifact_is_saved_to_local_media(self) -> None:
        engine = RecommendationEngine()

        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                artifact_uri = services.save_model_artifact(engine=engine, model_type="hybrid")

            model_path = Path(media_root) / artifact_uri
            self.assertTrue(model_path.exists())
            self.assertEqual(model_path.parent.name, "recommendation_models")
            self.assertEqual(model_path.suffix, ".pkl")


class RecommendationServiceTests(TestCase):
    def setUp(self) -> None:
        self.user = get_user_model().objects.create_user(email="reader@example.com", password="password")
        self.rated_book = Book.objects.create(title="Already Rated", slug="already-rated")
        self.candidate = Book.objects.create(
            title="Candidate",
            slug="candidate",
            average_rating=4.5,
            rating_count=20,
            popularity_score=12,
            trending_score=15,
        )
        Rating.objects.create(user=self.user, book=self.rated_book, value=5)

    def test_fallback_recommendations_exclude_seen_books(self) -> None:
        recommendations = services.generate_recommendations_for_user(
            user=self.user,
            n_recommendations=10,
            train_if_missing=False,
        )

        self.assertEqual([recommendation.book_id for recommendation in recommendations], [self.candidate.id])
        self.assertEqual(recommendations[0].source, "fallback")

    def test_generation_falls_back_when_training_artifact_cannot_be_saved(self) -> None:
        with patch.object(services, "train_recommendation_model", side_effect=PermissionError("media unwritable")):
            recommendations = services.generate_recommendations_for_user(
                user=self.user,
                n_recommendations=10,
                train_if_missing=True,
            )

        self.assertEqual([recommendation.book_id for recommendation in recommendations], [self.candidate.id])
        self.assertEqual(recommendations[0].source, "fallback")
