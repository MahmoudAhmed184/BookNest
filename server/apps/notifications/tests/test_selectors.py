from django.test import SimpleTestCase

from apps.notifications import selectors


class NotificationSelectorImportTests(SimpleTestCase):
    def test_notification_list_selector_exists(self):
        self.assertTrue(callable(selectors.notifications_for_user))
