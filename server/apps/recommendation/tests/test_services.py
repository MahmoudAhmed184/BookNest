from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.test import SimpleTestCase, TestCase, override_settings
import pandas as pd

from apps.books.models import Book, BookRating
from apps.recommendation import services
from apps.recommendation.recommendation_engine import RecommendationEngine
from apps.recommendation.signals import trigger_recommendations_after_rating
from apps.recommendation.tasks import enqueue_generate_recommendations_for_user


class RecommendationServiceImportTests(SimpleTestCase):
    def test_service_exposes_training_entrypoint(self):
        self.assertTrue(callable(services.RecommendationService.train_recommendation_model))

    def test_engine_excludes_all_items_seen_by_user(self):
        engine = RecommendationEngine(min_ratings_per_user=2)
        ratings_df = pd.DataFrame(
            [
                {"user_id": 1, "isbn13": "a", "rate": 5.0},
                {"user_id": 1, "isbn13": "b", "rate": 4.0},
                {"user_id": 2, "isbn13": "a", "rate": 5.0},
                {"user_id": 2, "isbn13": "c", "rate": 5.0},
                {"user_id": 3, "isbn13": "c", "rate": 4.0},
                {"user_id": 3, "isbn13": "d", "rate": 5.0},
            ]
        )

        self.assertIsNotNone(engine.train(ratings_df, test_size=0))

        recommended_items = {
            item_id for item_id, _score in engine.recommend_for_user(1, n_recommendations=10)
        }
        self.assertNotIn("a", recommended_items)
        self.assertNotIn("b", recommended_items)

    def test_model_artifact_is_saved_to_local_media(self):
        engine = RecommendationEngine()

        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                model_file_name = services.RecommendationService._save_model_artifact(
                    engine,
                    "svd",
                )

            model_path = Path(media_root) / model_file_name
            self.assertTrue(model_path.exists())
            self.assertEqual(model_path.parent.name, "recommendation_models")
            self.assertEqual(model_path.suffix, ".pkl")

    def test_enqueue_fails_fast_when_redis_broker_is_unreachable(self):
        with override_settings(CELERY_BROKER_URL="redis://127.0.0.1:1/0"):
            with self.assertRaises(ConnectionError):
                enqueue_generate_recommendations_for_user(1)


class RecommendationFallbackTests(TestCase):
    def setUp(self):
        post_save.disconnect(trigger_recommendations_after_rating, sender=BookRating)
        self.user = get_user_model().objects.create_user(
            username="reader",
            email="reader@example.com",
            password="password",
        )
        self.rated_book = Book.objects.create(
            isbn13="9780000000001",
            title="Already Rated",
        )
        self.unrated_book = Book.objects.create(
            isbn13="9780000000002",
            title="Recommended Candidate",
            average_rate=4.5,
            number_of_ratings=20,
        )
        BookRating.objects.create(user=self.user, book=self.rated_book, rate=5)

    def tearDown(self):
        post_save.connect(trigger_recommendations_after_rating, sender=BookRating)

    def test_catalog_fallback_excludes_rated_books(self):
        recommendations = services.RecommendationService._fallback_catalog_recommendations(
            user_id=self.user.id,
            n_recommendations=10,
        )

        recommended_isbns = {isbn for isbn, _score in recommendations}
        self.assertIn(self.unrated_book.isbn13, recommended_isbns)
        self.assertNotIn(self.rated_book.isbn13, recommended_isbns)
