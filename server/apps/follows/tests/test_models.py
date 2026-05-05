from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from apps.follows.models import Follow
from apps.users.models.profile import Profile

User = get_user_model()


class FollowModelTests(TestCase):
    def setUp(self) -> None:
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password1")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password2")
        self.user3 = User.objects.create_user(username="user3", email="user3@example.com", password="password3")

        self.profile1, _ = Profile.objects.get_or_create(user=self.user1, defaults={"bio": "Profile 1 Bio"})
        self.profile2, _ = Profile.objects.get_or_create(user=self.user2, defaults={"bio": "Profile 2 Bio"})
        self.profile3, _ = Profile.objects.get_or_create(user=self.user3, defaults={"bio": "Profile 3 Bio"})

    def test_follow_creation(self) -> None:
        follow = Follow.objects.create(follower=self.profile1, followed=self.profile2)
        self.assertEqual(follow.follower, self.profile1)
        self.assertEqual(follow.followed, self.profile2)
        self.assertIsNotNone(follow.created_at)
        self.assertEqual(str(follow), f"{self.profile1.user.username} follows {self.profile2.user.username}")

    def test_user_cannot_follow_themselves(self) -> None:
        initial_follow_count = Follow.objects.count()
        follow_attempt = Follow(follower=self.profile1, followed=self.profile1)
        follow_attempt.save()
        self.assertEqual(Follow.objects.count(), initial_follow_count)

    def test_unique_together_constraint(self) -> None:
        Follow.objects.create(follower=self.profile1, followed=self.profile2)
        with self.assertRaises(IntegrityError):
            Follow.objects.create(follower=self.profile1, followed=self.profile2)

    def test_related_names(self) -> None:
        Follow.objects.create(follower=self.profile1, followed=self.profile2)
        Follow.objects.create(follower=self.profile1, followed=self.profile3)
        Follow.objects.create(follower=self.profile2, followed=self.profile1)

        self.assertEqual(self.profile1.following.count(), 2)
        self.assertIn(self.profile2, [f.followed for f in self.profile1.following.all()])
        self.assertIn(self.profile3, [f.followed for f in self.profile1.following.all()])

        self.assertEqual(self.profile1.followers.count(), 1)
        self.assertIn(self.profile2, [f.follower for f in self.profile1.followers.all()])

        self.assertEqual(self.profile2.following.count(), 1)
        self.assertEqual(self.profile2.followers.count(), 1)

    def test_follow_ordering(self) -> None:
        follow1 = Follow.objects.create(follower=self.profile1, followed=self.profile2)
        follow2 = Follow.objects.create(follower=self.profile2, followed=self.profile3)

        follows = Follow.objects.all()
        self.assertEqual(follows.first(), follow2)
        self.assertEqual(follows.last(), follow1)
