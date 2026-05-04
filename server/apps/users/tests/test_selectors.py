from django.test import SimpleTestCase

from apps.users import selectors


class UserSelectorImportTests(SimpleTestCase):
    def test_user_data_queryset_selector_exists(self):
        self.assertTrue(callable(selectors.user_data_queryset))
