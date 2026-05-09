from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.books.models import Book
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.reviews.models import Rating, Review, ReviewVote
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

    def test_review_created_notifies_followers(self):
        author = self.create_user("author@example.com")
        follower = self.create_user("follower@example.com")
        book = Book.objects.create(title="Signal Book", slug="signal-book")
        FollowRelationship.objects.create(follower=follower, following=author)

        with self.captureOnCommitCallbacks(execute=True):
            review = Review.objects.create(user=author, book=book, body="Worth reading.")

        notification = Notification.objects.get(recipient=follower, action=Notification.Action.REVIEWED_BOOK)
        self.assertEqual(notification.notification_type, Notification.NotificationType.REVIEW)
        self.assertEqual(notification.actor_object_id, author.id)
        self.assertEqual(notification.target_object_id, book.id)
        self.assertEqual(notification.payload["review_id"], review.id)
        self.assertEqual(notification.payload["book_id"], book.id)

    def test_rating_created_notifies_followers(self):
        author = self.create_user("author@example.com")
        follower = self.create_user("follower@example.com")
        book = Book.objects.create(title="Signal Book", slug="signal-book")
        FollowRelationship.objects.create(follower=follower, following=author)

        with self.captureOnCommitCallbacks(execute=True):
            rating = Rating.objects.create(user=author, book=book, value=5)

        notification = Notification.objects.get(recipient=follower, action=Notification.Action.RATED_BOOK)
        self.assertEqual(notification.notification_type, Notification.NotificationType.RATING)
        self.assertEqual(notification.actor_object_id, author.id)
        self.assertEqual(notification.target_object_id, book.id)
        self.assertEqual(notification.payload["rating_id"], rating.id)
        self.assertEqual(notification.payload["book_id"], book.id)
        self.assertEqual(notification.payload["rating"], 5)

    def test_private_review_activity_does_not_notify_followers(self):
        author = self.create_user("private-author@example.com")
        follower = self.create_user("follower@example.com")
        book = Book.objects.create(title="Private Signal Book", slug="private-signal-book")
        FollowRelationship.objects.create(follower=follower, following=author)
        author.preferences.profile_public = False
        author.preferences.save(update_fields=["profile_public", "updated_at"])

        with self.captureOnCommitCallbacks(execute=True):
            Review.objects.create(user=author, book=book, body="Private review.")

        self.assertFalse(
            Notification.objects.filter(recipient=follower, action=Notification.Action.REVIEWED_BOOK).exists()
        )

    def test_hidden_rating_activity_does_not_notify_followers(self):
        author = self.create_user("hidden-ratings@example.com")
        follower = self.create_user("follower@example.com")
        book = Book.objects.create(title="Hidden Rating Book", slug="hidden-rating-book")
        FollowRelationship.objects.create(follower=follower, following=author)
        author.preferences.show_ratings_publicly = False
        author.preferences.save(update_fields=["show_ratings_publicly", "updated_at"])

        with self.captureOnCommitCallbacks(execute=True):
            Rating.objects.create(user=author, book=book, value=4)

        self.assertFalse(
            Notification.objects.filter(recipient=follower, action=Notification.Action.RATED_BOOK).exists()
        )

    def test_review_vote_notifies_review_owner(self):
        owner = self.create_user("owner@example.com")
        voter = self.create_user("voter@example.com")
        voter.display_name = "Voting Reader"
        voter.save(update_fields=["display_name", "updated_at"])
        book = Book.objects.create(title="Signal Book", slug="signal-book")
        review = Review.objects.create(user=owner, book=book, body="Worth reading.")

        with self.captureOnCommitCallbacks(execute=True):
            ReviewVote.objects.create(user=voter, review=review, vote_type=ReviewVote.VoteType.UP)

        notification = Notification.objects.get(recipient=owner, action=Notification.Action.REVIEW_UPVOTED)
        self.assertEqual(notification.payload["review_id"], review.id)
        self.assertEqual(NotificationSerializer(notification).data["actor_label"], "Voting Reader")
