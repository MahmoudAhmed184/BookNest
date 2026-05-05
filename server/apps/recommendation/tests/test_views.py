from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.books.models import Book
from apps.recommendation.models import UserRecommendation

User = get_user_model()


class UserRecommendationAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user = User.objects.create_user(username="reader", email="reader@example.com", password="password")
        self.other_user = User.objects.create_user(
            username="other-reader",
            email="other-reader@example.com",
            password="password",
        )
        self.book = Book.objects.create(isbn13="9780000000100", title="Recommended Book")
        self.other_book = Book.objects.create(isbn13="9780000000101", title="Other Recommendation")
        self.recommendation = UserRecommendation.objects.create(user=self.user, book=self.book, score=0.9)
        UserRecommendation.objects.create(user=self.other_user, book=self.other_book, score=0.8)

        self.list_url = reverse("recommendation-collection")
        self.refresh_url = reverse("recommendation-refresh-collection")

    def test_list_recommendations_requires_authentication(self) -> None:
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_recommendations_returns_authenticated_users_items(self) -> None:
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.recommendation.id)
        self.assertEqual(results[0]["book_title"], self.book.title)

    def test_generate_recommendations_rejects_invalid_count(self) -> None:
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.refresh_url, {"n_recommendations": "many"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "n_recommendations must be an integer.")
