from django.test import SimpleTestCase

from apps.books import selectors


class BookSelectorImportTests(SimpleTestCase):
    def test_review_list_selector_exists(self) -> None:
        self.assertTrue(callable(selectors.review_list))
