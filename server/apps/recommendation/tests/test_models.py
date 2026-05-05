from django.test import TestCase

from apps.recommendation.models import RecommendationModel


class RecommendationModelTests(TestCase):
    def test_model_string_uses_display_name(self) -> None:
        model = RecommendationModel.objects.create(model_type="svd")
        self.assertIn("Singular Value Decomposition", str(model))
