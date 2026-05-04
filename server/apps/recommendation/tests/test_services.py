from django.test import SimpleTestCase

from apps.recommendation import services


class RecommendationServiceImportTests(SimpleTestCase):
    def test_service_exposes_training_entrypoint(self):
        self.assertTrue(callable(services.RecommendationService.train_recommendation_model))
