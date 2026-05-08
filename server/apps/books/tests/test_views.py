from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.books.models import Author, AuthorLike, Book, Genre
from apps.books.services import set_book_authors, set_book_genres
from apps.users.models import Profile

User = get_user_model()


class BookListPaginationTests(APITestCase):
    def setUp(self) -> None:
        self.author = Author.objects.create(name="Octavia Butler", normalized_name="octavia butler", slug="octavia")
        self.genre = Genre.objects.create(name="Science Fiction", normalized_name="science fiction", slug="sci-fi")

    def create_book(self, title: str, *, rating: float, year: int) -> Book:
        book = Book.objects.create(
            title=title,
            slug=title.lower().replace(" ", "-"),
            average_rating=rating,
            rating_count=10,
            publication_year=year,
            trending_score=rating,
        )
        set_book_authors(book=book, author_ids=[self.author.id])
        set_book_genres(book=book, genre_ids=[self.genre.id])
        return book

    def test_books_list_is_paginated_and_filterable(self):
        first = self.create_book("Patternmaster", rating=4.5, year=1976)
        self.create_book("Kindred", rating=5, year=1979)
        self.create_book("Low Rated", rating=2, year=2020)

        response = self.client.get(
            "/api/v1/books/",
            {
                "genre_ids": str(self.genre.id),
                "min_rating": 4,
                "ordering": "newest",
                "page_size": 1,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(response.data["results"][0]["title"], "Kindred")
        self.assertIsNotNone(response.data["next"])

        next_response = self.client.get(response.data["next"])
        self.assertEqual(next_response.status_code, status.HTTP_200_OK)
        self.assertEqual(next_response.data["results"][0]["id"], first.id)

    def test_genres_list_uses_page_size_not_manual_limit_slice(self):
        for index in range(3):
            Genre.objects.create(name=f"Genre {index}", normalized_name=f"genre {index}", slug=f"genre-{index}")

        response = self.client.get("/api/v1/genres/", {"page_size": 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 4)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNotNone(response.data["next"])

    def test_create_book_author_and_genre_can_omit_slug(self):
        user = User.objects.create_user(email="staff@example.com", password="password", is_staff=True)
        Profile.objects.create(user=user, handle="staff")
        self.client.force_authenticate(user=user)
        response = self.client.post(
            "/api/v1/books/",
            {
                "title": "Server Owned Slug",
                "author_ids": [self.author.id],
                "genre_ids": [self.genre.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "server-owned-slug")
        self.assertEqual(response.data["author_names"], "Octavia Butler")
        self.assertEqual(response.data["genre_labels"], "Science Fiction")

    def test_catalog_writes_require_staff(self):
        user = User.objects.create_user(email="reader@example.com", password="password")
        Profile.objects.create(user=user, handle="reader")
        self.client.force_authenticate(user=user)

        response = self.client.post("/api/v1/books/", {"title": "Unmoderated"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AuthorLikeCountTests(TestCase):
    def test_author_like_count_stays_in_sync(self):
        user = User.objects.create_user(email="reader@example.com", password="password")
        author = Author.objects.create(name="Toni Morrison", normalized_name="toni morrison", slug="toni-morrison")

        with self.captureOnCommitCallbacks(execute=True):
            like = AuthorLike.objects.create(user=user, author=author)

        author.refresh_from_db()
        self.assertEqual(author.like_count, 1)

        with self.captureOnCommitCallbacks(execute=True):
            like.delete()

        author.refresh_from_db()
        self.assertEqual(author.like_count, 0)
