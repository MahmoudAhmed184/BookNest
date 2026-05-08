from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.books.models import Book
from apps.collections.models import CollectionPrivacy, ReadingCollection
from apps.collections.services import add_book_to_collection
from apps.reviews.models import Rating, Review
from apps.social.models import FeedEvent

User = get_user_model()


class FeedEventSignalTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(email="reader@example.com", password="password")
        self.book = Book.objects.create(title="Feed Signal Book", slug="feed-signal-book")

    def test_rating_and_review_create_feed_events(self):
        with self.captureOnCommitCallbacks(execute=True):
            Rating.objects.create(user=self.user, book=self.book, value=5)
            Review.objects.create(user=self.user, book=self.book, body="Excellent.")

        event_types = set(FeedEvent.objects.values_list("event_type", flat=True))
        self.assertIn(FeedEvent.EventType.RATING_CREATED, event_types)
        self.assertIn(FeedEvent.EventType.REVIEW_CREATED, event_types)

    def test_collection_book_create_feed_event_with_collection_visibility(self):
        collection = ReadingCollection.objects.create(
            owner=self.user,
            name="Private shelf",
            slug="private-shelf",
            privacy=CollectionPrivacy.PRIVATE,
        )

        with self.captureOnCommitCallbacks(execute=True):
            add_book_to_collection(collection=collection, book=self.book, added_by=self.user)

        event = FeedEvent.objects.get(event_type=FeedEvent.EventType.BOOK_ADDED)
        self.assertEqual(event.visibility, FeedEvent.Visibility.PRIVATE)
        self.assertEqual(event.book_id, self.book.id)
