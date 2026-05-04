from django.test import SimpleTestCase

from apps.recommendation import selectors


class RecommendationSelectorImportTests(SimpleTestCase):
    def test_user_recommendations_selector_exists(self):
        self.assertTrue(callable(selectors.user_recommendations))
