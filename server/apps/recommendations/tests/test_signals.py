from __future__ import annotations

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.books.models import Book
from apps.recommendations.models import RecommendationRun
from apps.reviews.models import Rating

User = get_user_model()


class RecommendationSignalTests(TestCase):
    def test_rating_threshold_creates_generation_run(self):
        user = User.objects.create_user(email="reader@example.com", password="password")
        books = [Book.objects.create(title=f"Book {index}", slug=f"book-{index}") for index in range(3)]

        with (
            patch("apps.recommendations.signals.enqueue_recommendation_run") as enqueue,
            self.captureOnCommitCallbacks(execute=True),
        ):
            for book in books:
                Rating.objects.create(user=user, book=book, value=5)

        run = RecommendationRun.objects.get(requested_by=user)
        self.assertEqual(run.run_type, RecommendationRun.RunType.GENERATE)
        self.assertEqual(run.parameters["user_id"], user.id)
        self.assertTrue(run.parameters["force_train"])
        enqueue.assert_called_once()
