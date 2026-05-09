from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.social.models import FollowRelationship
from apps.users.models import Profile

User = get_user_model()


class UserScopedFollowViewsTests(APITestCase):
    def create_reader(self, email: str, handle: str):
        user = User.objects.create_user(email=email, password="test-password-123")
        Profile.objects.create(user=user, handle=handle)
        return user

    def test_user_scoped_followers_return_target_rows_with_profile_summaries(self):
        target = self.create_reader("target@example.com", "target")
        follower = self.create_reader("follower@example.com", "follower")
        other = self.create_reader("other@example.com", "other")
        FollowRelationship.objects.create(follower=follower, following=target)
        FollowRelationship.objects.create(follower=target, following=other)

        response = self.client.get(f"/api/v1/users/{target.id}/followers/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        row = response.data["results"][0]
        self.assertEqual(row["follower_detail"]["id"], follower.id)
        self.assertEqual(row["follower_profile"]["handle"], "follower")
        self.assertEqual(row["following_detail"]["id"], target.id)
        self.assertEqual(row["following_profile"]["handle"], "target")

    def test_private_profile_blocks_user_scoped_social_lists_for_other_viewers(self):
        target = self.create_reader("private@example.com", "private")
        viewer = self.create_reader("viewer@example.com", "viewer")
        target.preferences.profile_public = False
        target.preferences.save(update_fields=["profile_public", "updated_at"])

        self.client.force_authenticate(user=viewer)
        response = self.client.get(f"/api/v1/users/{target.id}/following/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=target)
        owner_response = self.client.get(f"/api/v1/users/{target.id}/following/")

        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)

    def test_current_user_follow_list_can_filter_by_following_user(self):
        viewer = self.create_reader("viewer@example.com", "viewer")
        target = self.create_reader("target@example.com", "target")
        other = self.create_reader("other@example.com", "other")
        target_follow = FollowRelationship.objects.create(follower=viewer, following=target)
        FollowRelationship.objects.create(follower=viewer, following=other)

        self.client.force_authenticate(user=viewer)
        response = self.client.get(f"/api/v1/follows/?following={target.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], target_follow.id)

    def test_follow_endpoint_creates_notification_for_followed_user(self):
        viewer = self.create_reader("viewer@example.com", "viewer")
        target = self.create_reader("target@example.com", "target")

        self.client.force_authenticate(user=viewer)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post("/api/v1/follows/", {"following": target.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(recipient=target, action=Notification.Action.FOLLOWED)
        self.assertEqual(notification.actor_object_id, viewer.id)
        self.assertEqual(notification.payload["follower_id"], viewer.id)
        self.assertFalse(Notification.objects.filter(recipient=viewer, action=Notification.Action.FOLLOWED).exists())
