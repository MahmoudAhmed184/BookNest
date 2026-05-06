from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.books.models import Author, Book, BookRating, BookReview, Genre
from apps.users.models.profile import Profile

User = get_user_model()


class BookAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="testuser@example.com", password="testpassword"
        )
        self.admin_user = User.objects.create_superuser(
            username="adminuser", email="admin@example.com", password="adminpassword"
        )
        Profile.objects.get_or_create(user=self.user, defaults={"bio": "Test user profile"})
        Profile.objects.get_or_create(user=self.admin_user, defaults={"bio": "Admin user profile"})

        self.author1 = Author.objects.create(name="Author One")
        self.book1 = Book.objects.create(
            isbn13="9780000000001", title="Test Book 1", publication_date=date(2020, 1, 1), number_of_pages=200
        )
        self.book1.authors.add(self.author1)

        self.book2 = Book.objects.create(
            isbn13="9780000000002", title="Test Book 2", publication_date=date(2021, 1, 1), number_of_pages=250
        )
        self.book2.authors.add(self.author1)

        self.book_list_url = reverse("book-collection")
        self.book_detail_url = lambda pk: reverse("book-resource", kwargs={"pk": pk})
        self.book_create_url = self.book_list_url
        self.book_update_url = self.book_detail_url
        self.book_delete_url = self.book_detail_url

    def test_get_book_list_unauthenticated(self) -> None:
        response = self.client.get(self.book_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)

    def test_get_book_detail_unauthenticated(self) -> None:
        response = self.client.get(self.book_detail_url(self.book1.isbn13))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.book1.title)

    def test_create_book_unauthenticated(self) -> None:
        data = {
            "isbn13": "9780000000003",
            "title": "New Book",
            "publication_date": "2022-01-01",
            "number_of_pages": 150,
            "authors": [
                {
                    "author_id": self.author1.author_id,
                    "name": self.author1.name,
                    "number_of_books": self.author1.number_of_books,
                }
            ],
            "genres": ["Fiction"],
        }
        response = self.client.post(self.book_create_url, data, format="json")
        self.assertIn(response.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

    def test_create_book_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "isbn13": "9780000000003",
            "title": "New Book by Admin",
            "publication_date": "2022-01-01",
            "number_of_pages": 150,
            "authors": [
                {
                    "author_id": self.author1.author_id,
                    "name": self.author1.name,
                    "number_of_books": self.author1.number_of_books,
                }
            ],
            "genres": ["Fiction"],
        }
        response = self.client.post(self.book_create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Book.objects.count(), 3)
        self.assertEqual(Book.objects.get(isbn13="9780000000003").title, "New Book by Admin")

    def test_update_book_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        updated_data = {"title": "Updated Test Book 1"}
        response = self.client.patch(self.book_update_url(self.book1.isbn13), updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.book1.refresh_from_db()
        self.assertEqual(self.book1.title, "Updated Test Book 1")

    def test_delete_book_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.book_delete_url(self.book1.isbn13))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Book.objects.count(), 1)

    def test_create_review_uses_authenticated_user(self) -> None:
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("review-collection"),
            {
                "book": self.book1.isbn13,
                "review_text": "Great read",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        review = BookReview.objects.get(book=self.book1)
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.review_text, "Great read")
        self.assertNotIn("user", response.data)

    def test_create_rating_uses_authenticated_user(self) -> None:
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("rating-collection"),
            {
                "book": self.book1.isbn13,
                "rate": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        rating = BookRating.objects.get(book=self.book1)
        self.assertEqual(rating.user, self.user)
        self.assertEqual(float(rating.rate), 4.0)
        self.assertNotIn("user", response.data)


class AuthorAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser_author", email="testuser_author@example.com", password="testpassword"
        )
        self.admin_user = User.objects.create_superuser(
            username="adminuser_author", email="admin_author@example.com", password="adminpassword"
        )

        self.author1 = Author.objects.create(name="Author Alpha")
        self.author2 = Author.objects.create(name="Author Beta")

        self.author_list_url = reverse("author-list")
        self.author_detail_url = lambda pk: reverse("author-detail", kwargs={"pk": pk})
        self.author_create_url = self.author_list_url
        self.author_update_url = self.author_detail_url
        self.author_delete_url = self.author_detail_url

    def test_get_author_list_unauthenticated(self) -> None:
        response = self.client.get(self.author_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)

    def test_get_author_detail_unauthenticated(self) -> None:
        response = self.client.get(self.author_detail_url(self.author1.author_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.author1.name)

    def test_create_author_unauthenticated(self) -> None:
        data = {"name": "New Author"}
        response = self.client.post(self.author_create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_create_author_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        data = {"name": "New Author Admin"}
        response = self.client.post(self.author_create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(Author.objects.count(), 2)
        self.assertFalse(Author.objects.filter(name="New Author Admin").exists())

    def test_update_author_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        updated_data = {"name": "Updated Author Alpha"}
        response = self.client.patch(self.author_update_url(self.author1.author_id), updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.author1.refresh_from_db()
        self.assertEqual(self.author1.name, "Author Alpha")

    def test_delete_author_authenticated_admin(self) -> None:
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.author_delete_url(self.author1.author_id))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(Author.objects.count(), 2)

    def test_get_author_books_by_id(self) -> None:
        book = Book.objects.create(isbn13="9781111111111", title="Book by Alpha")
        book.authors.add(self.author1)
        url = reverse("author-books", kwargs={"pk": self.author1.author_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Book by Alpha")

    def test_get_author_list_filters_by_name(self) -> None:
        response = self.client.get(self.author_list_url, {"name__icontains": "Alpha"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Author Alpha")


class GenreAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.fiction = Genre.objects.create(name="Fiction")
        self.mystery = Genre.objects.create(name="Mystery")
        self.unused = Genre.objects.create(name="Unused")

        self.book1 = Book.objects.create(isbn13="9780000000001", title="Fiction Book 1")
        self.book1.genres.add(self.fiction)
        self.book2 = Book.objects.create(isbn13="9780000000002", title="Fiction Book 2")
        self.book2.genres.add(self.fiction)
        self.book3 = Book.objects.create(isbn13="9780000000003", title="Mystery Book")
        self.book3.genres.add(self.mystery)

    def test_genre_list_returns_popular_genres(self) -> None:
        response = self.client.get(reverse("genre-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data

        self.assertEqual([genre["name"] for genre in results], ["Fiction", "Mystery"])
        self.assertEqual(results[0]["book_count"], 2)
        self.assertEqual(results[1]["book_count"], 1)
