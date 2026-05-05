from unittest.mock import patch

from django.test import TestCase

from apps.books.models import Author, Book, BookSearchIndex, Genre
from apps.books.utils.search_index import sync_book_search_index
from apps.books.utils.search_service import DatabaseSearchService


class BookSearchServiceTests(TestCase):
    def setUp(self) -> None:
        self.author = Author.objects.create(name="Guido van Rossum")
        self.genre = Genre.objects.create(name="Programming")
        self.book = Book.objects.create(
            isbn13="9781492051367",
            isbn="1492051365",
            title="Python Cookbook",
            description="Recipes for modern Python applications.",
        )
        self.book.authors.add(self.author)
        self.book.genres.add(self.genre)
        sync_book_search_index(self.book.pk)

    def test_search_index_contains_weighted_book_metadata(self) -> None:
        search_index = BookSearchIndex.objects.get(book=self.book)

        self.assertIn("Python Cookbook", search_index.document)
        self.assertIn("Guido van Rossum", search_index.document)
        self.assertIn("Programming", search_index.document)
        self.assertIn("9781492051367", search_index.document)

    def test_search_books_returns_local_full_text_matches(self) -> None:
        books, total_count = DatabaseSearchService.search_books(
            "python",
            page_size=10,
            include_external=False,
        )

        self.assertEqual(total_count, 1)
        self.assertEqual(books[0]["isbn13"], self.book.isbn13)

    def test_no_local_results_queue_external_enrichment_without_waiting(self) -> None:
        with patch.object(
            DatabaseSearchService,
            "_enqueue_external_enrichment",
            return_value=True,
        ) as enqueue_external:
            books, total_count = DatabaseSearchService.search_books(
                "missingcatalogtitle",
                page_size=10,
                include_external=True,
            )

        self.assertEqual(books, [])
        self.assertEqual(total_count, 0)
        enqueue_external.assert_called_once_with("missingcatalogtitle", 10)
