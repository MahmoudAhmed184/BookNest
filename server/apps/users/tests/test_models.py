from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from apps.users.models.profile import Profile, ProfileInterest, ProfileSocialLink

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user(self) -> None:
        user = User.objects.create_user(username="testuser", email="testuser@example.com", password="password123")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "testuser@example.com")
        self.assertTrue(user.check_password("password123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_no_email(self) -> None:
        with self.assertRaises(ValueError):
            User.objects.create_user(username="testuser2", email="", password="password123")

    def test_create_superuser(self) -> None:
        admin_user = User.objects.create_superuser(
            username="adminuser", email="admin@example.com", password="password123"
        )
        self.assertEqual(admin_user.username, "adminuser")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.check_password("password123"))
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_user_str_representation(self) -> None:
        user = User.objects.create_user(username="struser", email="str@example.com", password="password")
        self.assertEqual(str(user), "struser")


class ProfileModelTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username="profileuser", email="profile@example.com", password="password")
        self.profile, _ = Profile.objects.get_or_create(user=self.user, defaults={"bio": "Test bio"})

    def test_profile_creation(self) -> None:
        self.assertIsNotNone(self.profile)
        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(self.profile.bio, "Test bio")
        self.assertEqual(self.profile.profile_type, "REGULAR")

    def test_profile_str_representation(self) -> None:
        self.assertEqual(str(self.profile), "profileuser's Profile")

    def test_profile_interest(self) -> None:
        interest = ProfileInterest.objects.create(profile=self.profile, interest="Django")
        self.assertEqual(str(interest), "profileuser - Django")
        self.assertEqual(self.profile.interests.count(), 1)

    def test_duplicate_profile_interest(self) -> None:
        ProfileInterest.objects.create(profile=self.profile, interest="Django")
        with self.assertRaises(IntegrityError):
            ProfileInterest.objects.create(profile=self.profile, interest="Django")

    def test_profile_social_link(self) -> None:
        social_link = ProfileSocialLink.objects.create(
            profile=self.profile, platform="TWITTER", url="https://twitter.com/testuser"
        )
        self.assertEqual(str(social_link), "profileuser - TWITTER")
        self.assertEqual(self.profile.social_links.count(), 1)

    def test_duplicate_profile_social_link_platform(self) -> None:
        ProfileSocialLink.objects.create(profile=self.profile, platform="TWITTER", url="https://twitter.com/test1")
        with self.assertRaises(IntegrityError):
            ProfileSocialLink.objects.create(profile=self.profile, platform="TWITTER", url="https://twitter.com/test2")

    def test_profile_settings_default(self) -> None:
        self.assertEqual(self.profile.settings, {})

    def test_profile_settings_update(self) -> None:
        self.profile.settings = {"theme": "dark"}
        self.profile.save()
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.settings, {"theme": "dark"})
