from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.books.models import Book
from apps.reviews.models import Review
from apps.users.models import Profile

User = get_user_model()


class ReviewResourceViewTests(APITestCase):
    def create_reader(self, email: str, handle: str):
        user = User.objects.create_user(email=email, password="test-password-123")
        Profile.objects.create(user=user, handle=handle)
        return user

    def test_review_can_edit_flag_is_only_true_for_owner(self):
        owner = self.create_reader("owner@example.com", "owner")
        viewer = self.create_reader("viewer@example.com", "viewer")
        book = Book.objects.create(title="Test Book", slug="test-book")
        Review.objects.create(user=owner, book=book, body="Original review.")

        self.client.force_authenticate(user=viewer)
        viewer_response = self.client.get(f"/api/v1/books/{book.id}/reviews/")

        self.assertEqual(viewer_response.status_code, status.HTTP_200_OK)
        self.assertEqual(viewer_response.data["results"][0]["can_edit"], False)

        self.client.force_authenticate(user=owner)
        owner_response = self.client.get(f"/api/v1/books/{book.id}/reviews/")

        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(owner_response.data["results"][0]["can_edit"], True)

    def test_review_update_is_limited_to_owner(self):
        owner = self.create_reader("owner@example.com", "owner")
        viewer = self.create_reader("viewer@example.com", "viewer")
        book = Book.objects.create(title="Test Book", slug="test-book")
        review = Review.objects.create(user=owner, book=book, body="Original review.")

        self.client.force_authenticate(user=viewer)
        forbidden_response = self.client.patch(
            f"/api/v1/reviews/{review.id}/",
            {"body": "Changed by someone else."},
            format="json",
        )
        review.refresh_from_db()

        self.assertEqual(forbidden_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(review.body, "Original review.")

        self.client.force_authenticate(user=owner)
        owner_response = self.client.patch(
            f"/api/v1/reviews/{review.id}/",
            {"body": "Changed by owner."},
            format="json",
        )
        review.refresh_from_db()

        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(review.body, "Changed by owner.")
