from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import connection
from rest_framework import status
from rest_framework.test import APITestCase

from apps.books.models import Book
from apps.collections.models import CollectionPrivacy, ReadingCollection
from apps.reviews.models import Rating, Review
from apps.users.models import Profile
from apps.users.serializers import ProfileSerializer

User = get_user_model()

PROFILE_PICTURE_URL = "https://res.cloudinary.com/demo/image/upload/v1/profile_pictures/target_profile"


class UserProfileActivityViewsTests(APITestCase):
    def create_reader(self, email: str, handle: str):
        user = User.objects.create_user(email=email, password="test-password-123")
        Profile.objects.create(user=user, handle=handle)
        return user

    def create_book(self, title: str = "Test Book") -> Book:
        return Book.objects.create(title=title, slug=title.lower().replace(" ", "-"))

    def set_profile_picture(self, profile: Profile, url: str) -> None:
        table_name = connection.ops.quote_name(Profile._meta.db_table)
        with connection.cursor() as cursor:
            cursor.execute(f"UPDATE {table_name} SET picture = %s WHERE id = %s", [url, profile.id])

    def test_profile_serializer_returns_cloudinary_url_without_imagefield_rewrite(self):
        target = self.create_reader("target@example.com", "target")
        target.profile.picture = PROFILE_PICTURE_URL

        data = ProfileSerializer(target.profile).data

        self.assertEqual(data["picture"], PROFILE_PICTURE_URL)

    def test_profile_overview_returns_bounded_activity_and_viewer_context(self):
        target = self.create_reader("target@example.com", "target")
        target.display_name = "Target Reader"
        target.save(update_fields=["display_name", "updated_at"])
        self.set_profile_picture(target.profile, PROFILE_PICTURE_URL)
        target.profile.picture_fallback_url = "/user_profile.png"
        target.profile.save(update_fields=["picture_fallback_url", "updated_at"])
        viewer = self.create_reader("viewer@example.com", "viewer")
        book = self.create_book()
        rating = Rating.objects.create(user=target, book=book, value=5)
        Review.objects.create(user=target, book=book, rating=rating, body="A sharp read.")
        ReadingCollection.objects.create(
            owner=target,
            name="Public shelf",
            slug="public-shelf",
            privacy=CollectionPrivacy.PUBLIC,
        )

        self.client.force_authenticate(user=viewer)
        response = self.client.get(f"/api/v1/users/{target.id}/profile-overview/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], target.id)
        self.assertEqual(response.data["user"]["name"], "Target Reader")
        self.assertTrue(response.data["user"]["profile_picture"].startswith("https://res.cloudinary"))
        self.assertNotIn("image/upload/https://", response.data["user"]["profile_picture"])
        self.assertEqual(response.data["user"]["profile_picture_fallback_url"], "/user_profile.png")
        self.assertNotIn("email", response.data["user"])
        self.assertEqual(response.data["profile"]["name"], "Target Reader")
        self.assertTrue(response.data["profile"]["picture"].startswith("https://res.cloudinary"))
        self.assertNotIn("image/upload/https://", response.data["profile"]["picture"])
        self.assertEqual(response.data["profile"]["picture_fallback_url"], "/user_profile.png")
        self.assertNotIn("email", response.data["profile"]["user"])
        self.assertEqual(response.data["profile"]["handle"], "target")
        self.assertFalse(response.data["viewer_context"]["is_self"])
        self.assertFalse(response.data["viewer_context"]["can_view_private"])
        self.assertEqual(response.data["stats"]["reviews_count"], 1)
        self.assertEqual(response.data["stats"]["ratings_count"], 1)
        self.assertEqual(response.data["stats"]["collections_count"], 1)
        self.assertEqual(len(response.data["recent_reviews"]), 1)
        self.assertEqual(response.data["recent_reviews"][0]["user_detail"]["name"], "Target Reader")
        self.assertTrue(
            response.data["recent_reviews"][0]["user_detail"]["profile_picture"].startswith(
                "https://res.cloudinary"
            )
        )
        self.assertNotIn(
            "image/upload/https://",
            response.data["recent_reviews"][0]["user_detail"]["profile_picture"],
        )
        self.assertEqual(
            response.data["recent_reviews"][0]["user_detail"]["profile_picture_fallback_url"],
            "/user_profile.png",
        )
        self.assertEqual(len(response.data["recent_ratings"]), 1)
        self.assertEqual(len(response.data["recent_collections"]), 1)

    def test_profile_overview_by_handle_returns_matching_response_shape(self):
        target = self.create_reader("target@example.com", "target-reader")
        book = self.create_book()
        Rating.objects.create(user=target, book=book, value=5)

        response = self.client.get("/api/v1/profiles/by-handle/target-reader/overview/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], target.id)
        self.assertEqual(response.data["profile"]["handle"], "target-reader")
        self.assertIn("viewer_context", response.data)
        self.assertIn("stats", response.data)
        self.assertIn("recent_reviews", response.data)
        self.assertIn("recent_ratings", response.data)
        self.assertIn("recent_collections", response.data)

    def test_profile_overview_by_handle_returns_404_for_missing_handle(self):
        response = self.client.get("/api/v1/profiles/by-handle/missing-reader/overview/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_private_profile_blocks_handle_profile_overview_for_other_viewers(self):
        target = self.create_reader("target@example.com", "target")
        viewer = self.create_reader("viewer@example.com", "viewer")
        target.preferences.profile_public = False
        target.preferences.save(update_fields=["profile_public", "updated_at"])

        self.client.force_authenticate(user=viewer)
        response = self.client.get("/api/v1/profiles/by-handle/target/overview/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ratings_privacy_hides_overview_ratings_and_blocks_detail_list(self):
        target = self.create_reader("target@example.com", "target")
        viewer = self.create_reader("viewer@example.com", "viewer")
        book = self.create_book()
        Rating.objects.create(user=target, book=book, value=4)
        target.preferences.show_ratings_publicly = False
        target.preferences.save(update_fields=["show_ratings_publicly", "updated_at"])

        self.client.force_authenticate(user=viewer)
        overview = self.client.get(f"/api/v1/users/{target.id}/profile-overview/")
        ratings = self.client.get(f"/api/v1/users/{target.id}/ratings/")

        self.assertEqual(overview.status_code, status.HTTP_200_OK)
        self.assertEqual(overview.data["stats"]["ratings_count"], 0)
        self.assertEqual(overview.data["recent_ratings"], [])
        self.assertEqual(ratings.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=target)
        owner_ratings = self.client.get(f"/api/v1/users/{target.id}/ratings/")

        self.assertEqual(owner_ratings.status_code, status.HTTP_200_OK)
        self.assertEqual(owner_ratings.data["count"], 1)

    def test_private_profile_blocks_profile_overview_for_other_viewers(self):
        target = self.create_reader("target@example.com", "target")
        viewer = self.create_reader("viewer@example.com", "viewer")
        target.preferences.profile_public = False
        target.preferences.save(update_fields=["profile_public", "updated_at"])

        self.client.force_authenticate(user=viewer)
        response = self.client.get(f"/api/v1/users/{target.id}/profile-overview/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_private_profile_is_hidden_from_profile_endpoints_for_other_viewers(self):
        target = self.create_reader("target@example.com", "target")
        viewer = self.create_reader("viewer@example.com", "viewer")
        target.preferences.profile_public = False
        target.preferences.save(update_fields=["profile_public", "updated_at"])

        self.client.force_authenticate(user=viewer)
        list_response = self.client.get("/api/v1/profiles/")
        detail_response = self.client.get(f"/api/v1/profiles/{target.profile.id}/")
        user_profile_response = self.client.get(f"/api/v1/users/{target.id}/profile/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)
        self.assertEqual(list_response.data["results"][0]["handle"], "viewer")
        self.assertEqual(detail_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(user_profile_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_detail_update_is_limited_to_owner_or_staff(self):
        target = self.create_reader("target@example.com", "target")
        viewer = self.create_reader("viewer@example.com", "viewer")

        self.client.force_authenticate(user=viewer)
        forbidden_response = self.client.patch(
            f"/api/v1/profiles/{target.profile.id}/",
            {"bio": "Changed by someone else."},
            format="json",
        )
        target.profile.refresh_from_db()

        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(target.profile.bio, "")

        self.client.force_authenticate(user=target)
        owner_response = self.client.patch(
            f"/api/v1/profiles/{target.profile.id}/",
            {"bio": "Changed by owner."},
            format="json",
        )
        target.profile.refresh_from_db()

        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
        self.assertEqual(target.profile.bio, "Changed by owner.")
