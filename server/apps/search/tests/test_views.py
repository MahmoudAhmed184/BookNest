from __future__ import annotations

from rest_framework import status
from rest_framework.test import APITestCase

from apps.books.models import Author, Book, Genre
from apps.books.services import set_book_authors, set_book_genres
from apps.search.models import SearchAutocompleteTerm
from apps.search.services import rebuild_autocomplete_terms


class SearchViewsTests(APITestCase):
    def create_book(self, title: str, *, author: Author, genre: Genre, rating: float = 0) -> Book:
        book = Book.objects.create(
            title=title,
            slug=title.lower().replace(" ", "-"),
            average_rating=rating,
            rating_count=5,
        )
        set_book_authors(book=book, author_ids=[author.id])
        set_book_genres(book=book, genre_ids=[genre.id])
        return book

    def test_book_search_supports_filters_and_pagination_envelope(self):
        author = Author.objects.create(name="Ada Lovelace", normalized_name="ada lovelace", slug="ada-lovelace")
        genre = Genre.objects.create(name="Programming", normalized_name="programming", slug="programming")
        other_genre = Genre.objects.create(name="History", normalized_name="history", slug="history")
        match = self.create_book("Python Patterns", author=author, genre=genre, rating=4.8)
        self.create_book("Python in History", author=author, genre=other_genre, rating=3.0)

        response = self.client.get(
            "/api/v1/search/books/",
            {
                "q": "python",
                "genres": "Programming",
                "min_rating": 4,
                "page_size": 1,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], match.id)
        self.assertEqual(response.data["filters_applied"]["genres"], "Programming")

    def test_search_suggestions_use_autocomplete_terms(self):
        author = Author.objects.create(name="Jane Austen", normalized_name="jane austen", slug="jane-austen")
        genre = Genre.objects.create(name="Classics", normalized_name="classics", slug="classics")
        self.create_book("Pride and Prejudice", author=author, genre=genre, rating=5)
        rebuild_autocomplete_terms()

        response = self.client.get("/api/v1/search/suggestions/", {"q": "pri", "limit": 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["suggestions"][0]["term"], "Pride and Prejudice")
        self.assertEqual(SearchAutocompleteTerm.objects.get(term="Pride and Prejudice").use_count, 1)

    def test_related_book_suggestions_use_author_and_genre_overlap(self):
        author = Author.objects.create(name="Ursula Le Guin", normalized_name="ursula le guin", slug="ursula-le-guin")
        genre = Genre.objects.create(name="Science Fiction", normalized_name="science fiction", slug="science-fiction")
        reference = self.create_book("The Dispossessed", author=author, genre=genre, rating=5)
        related = self.create_book("The Left Hand of Darkness", author=author, genre=genre, rating=5)

        response = self.client.get("/api/v1/search/related-books/", {"book_id": reference.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["suggestions"][0]["id"], related.id)
