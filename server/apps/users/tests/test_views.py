from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.users.models.profile import Profile

User = get_user_model()


class UserAuthAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.register_url = reverse("user-collection")
        self.login_url = reverse("session-collection")
        self.logout_url = reverse("current-session")
        self.user_details_url = reverse("current-user")
        self.token_verify_url = reverse("token-verify")
        self.token_refresh_url = reverse("token-refresh")

        self.user_data = {
            "username": "testuser_api",
            "email": "testuser_api@example.com",
            "password1": "StrongerPass123!",
            "password2": "StrongerPass123!",
        }
        self.user_login_data = {
            "email": "testuser_api@example.com",  # CustomLoginSerializer uses email
            "password": "StrongerPass123!",
        }

    def test_user_registration(self) -> None:
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser_api").exists())
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

    def test_user_login(self) -> None:
        self.client.post(self.register_url, self.user_data, format="json")
        response = self.client.post(self.login_url, self.user_login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertIn("user", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["username"], self.user_data["username"])

    def test_user_logout(self) -> None:
        self.client.post(self.register_url, self.user_data, format="json")
        login_response = self.client.post(self.login_url, self.user_login_data, format="json")
        access_token = login_response.data["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        logout_response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

    def test_get_user_details_authenticated(self) -> None:
        self.client.post(self.register_url, self.user_data, format="json")
        login_response = self.client.post(self.login_url, self.user_login_data, format="json")
        access_token = login_response.data["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.get(self.user_details_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user_data["username"])

    def test_get_user_details_unauthenticated(self) -> None:
        response = self.client.get(self.user_details_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_verify(self) -> None:
        self.client.post(self.register_url, self.user_data, format="json")
        login_response = self.client.post(self.login_url, self.user_login_data, format="json")
        access_token = login_response.data["data"]["access"]

        response = self.client.post(self.token_verify_url, {"token": access_token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_refresh(self) -> None:
        self.client.post(self.register_url, self.user_data, format="json")
        login_response = self.client.post(self.login_url, self.user_login_data, format="json")
        refresh_token = login_response.data["data"]["refresh"]

        response = self.client.post(self.token_refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


class ProfileAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username="user1_profile_api", email="user1_profile@api.com", password="password1"
        )
        self.user2 = User.objects.create_user(
            username="user2_profile_api", email="user2_profile@api.com", password="password2"
        )

        self.profile1, _ = Profile.objects.get_or_create(user=self.user1, defaults={"bio": "User 1 Bio API"})
        self.profile2, _ = Profile.objects.get_or_create(user=self.user2, defaults={"bio": "User 2 Bio API"})

        self.profile_list_create_url = reverse("profile-collection")
        self.my_profile_url = reverse("current-profile")
        self.profile_detail_url = lambda pk: reverse("profile-resource", kwargs={"pk": pk})
        self.profile_upload_pic_url = reverse("current-profile-picture")

        self.client.force_authenticate(user=self.user1)

    def test_get_my_profile(self) -> None:
        response = self.client.get(self.my_profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile = response.data["data"]["profile"]
        self.assertEqual(profile["username"], self.user1.username)
        self.assertEqual(profile["bio"], self.profile1.bio)

    def test_update_my_profile(self) -> None:
        updated_data = {"bio": "Updated bio for user1", "profile_type": "AUTHOR"}
        response = self.client.patch(self.my_profile_url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.bio, "Updated bio for user1")
        self.assertEqual(self.profile1.profile_type, "AUTHOR")

    def test_list_profiles_authenticated(self) -> None:
        response = self.client.get(self.profile_list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["data"]["profiles"]), 2)

    def test_retrieve_profile_authenticated(self) -> None:
        response = self.client.get(self.profile_detail_url(self.profile2.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["profile"]["username"], self.user2.username)

    def test_cannot_update_other_user_profile(self) -> None:
        updated_data = {"bio": "Attempted update by another user"}
        response = self.client.patch(self.profile_detail_url(self.profile2.pk), updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_profile_fails_if_already_exists(self) -> None:
        profile_data = {"bio": "Trying to create another profile", "profile_type": "REGULAR"}
        response = self.client.post(self.profile_list_create_url, profile_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertEqual(response.data["errors"]["detail"], "User already has a profile")

    @patch("apps.users.services.cloudinary.uploader.upload")
    def test_upload_profile_picture(self, mock_upload: Mock) -> None:
        mock_upload.return_value = {
            "secure_url": "https://example.com/profile.jpg",
            "public_id": "profile_pics/user1_profile_api/user1_profile_api_profile",
        }
        image = SimpleUploadedFile(name="test_image.jpg", content=b"file_content", content_type="image/jpeg")
        response = self.client.post(self.profile_upload_pic_url, {"profile_pic": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profile_pic_url", response.data["data"])
        self.profile1.refresh_from_db()
        self.assertTrue(str(self.profile1.profile_pic).startswith("http"))

    def test_upload_profile_picture_no_file(self) -> None:
        response = self.client.post(self.profile_upload_pic_url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertEqual(response.data["errors"]["profile_pic"], "No image file provided")

    def test_upload_profile_picture_invalid_file_type(self) -> None:
        text_file = SimpleUploadedFile(name="test_file.txt", content=b"some text", content_type="text/plain")
        response = self.client.post(self.profile_upload_pic_url, {"profile_pic": text_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertIn("Invalid file type", response.data["errors"]["profile_pic"])

    def test_get_profile_by_username_query_param(self) -> None:
        response = self.client.get(self.profile_list_create_url, {"username": self.user2.username})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["profiles"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["username"], self.user2.username)

    def test_unauthenticated_access_to_profile_endpoints(self) -> None:
        self.client.force_authenticate(user=None)

        response_my_profile = self.client.get(self.my_profile_url)
        self.assertEqual(response_my_profile.status_code, status.HTTP_401_UNAUTHORIZED)

        response_list = self.client.get(self.profile_list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_401_UNAUTHORIZED)

        response_detail = self.client.get(self.profile_detail_url(self.profile1.pk))
        self.assertEqual(response_detail.status_code, status.HTTP_401_UNAUTHORIZED)

        response_upload = self.client.post(self.profile_upload_pic_url, {}, format="multipart")
        self.assertEqual(response_upload.status_code, status.HTTP_401_UNAUTHORIZED)
