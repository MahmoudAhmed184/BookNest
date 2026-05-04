from django.test import SimpleTestCase

from apps.follows import services


class FollowServiceImportTests(SimpleTestCase):
    def test_create_follow_service_exists(self):
        self.assertTrue(callable(services.create_follow))
