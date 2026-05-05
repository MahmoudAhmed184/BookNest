from django.test import SimpleTestCase

from apps.books import services


class BookServiceImportTests(SimpleTestCase):
    def test_rating_recalculation_service_exists(self) -> None:
        self.assertTrue(callable(services.recalculate_book_rating))
