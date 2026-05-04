from django.test import SimpleTestCase

from apps.notifications import services


class NotificationServiceImportTests(SimpleTestCase):
    def test_notification_service_exposes_unread_count(self):
        self.assertTrue(callable(services.NotificationService.get_unread_count))
