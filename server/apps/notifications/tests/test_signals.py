from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.books.models import Book
from apps.notifications.models import Notification
from apps.reviews.models import Review, ReviewVote
from apps.social.models import FollowRelationship

User = get_user_model()


class NotificationSignalTests(TestCase):
    def create_user(self, email: str):
        return User.objects.create_user(email=email, password="password")

    def test_new_user_gets_welcome_notification(self):
        with self.captureOnCommitCallbacks(execute=True):
            user = self.create_user("new@example.com")

        notification = Notification.objects.get(recipient=user, action=Notification.Action.SYSTEM_MESSAGE)
        self.assertEqual(notification.notification_type, Notification.NotificationType.SYSTEM)

    def test_follow_creates_notification_for_followed_user(self):
        follower = self.create_user("follower@example.com")
        followed = self.create_user("followed@example.com")

        with self.captureOnCommitCallbacks(execute=True):
            FollowRelationship.objects.create(follower=follower, following=followed)

        notification = Notification.objects.get(recipient=followed, action=Notification.Action.FOLLOWED)
        self.assertEqual(notification.actor_object_id, follower.id)

    def test_review_vote_notifies_review_owner(self):
        owner = self.create_user("owner@example.com")
        voter = self.create_user("voter@example.com")
        book = Book.objects.create(title="Signal Book", slug="signal-book")
        review = Review.objects.create(user=owner, book=book, body="Worth reading.")

        with self.captureOnCommitCallbacks(execute=True):
            ReviewVote.objects.create(user=voter, review=review, vote_type=ReviewVote.VoteType.UP)

        notification = Notification.objects.get(recipient=owner, action=Notification.Action.REVIEW_UPVOTED)
        self.assertEqual(notification.payload["review_id"], review.id)
