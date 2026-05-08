from __future__ import annotations

from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.books.models import Book
from apps.social.models import FeedEvent


class FeedEventCursorPaginationTests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(email="feed@example.com", password="password")
        self.book = Book.objects.create(title="Feed Book", slug="feed-book")
        self.url = reverse("feed-event-list")

    def _create_event(self, *, occurred_at):
        event = FeedEvent.objects.create(
            actor=self.user,
            event_type=FeedEvent.EventType.RATING_CREATED,
            book=self.book,
            occurred_at=occurred_at,
        )
        return event

    def test_feed_uses_cursor_envelope_and_next_cursor(self) -> None:
        now = timezone.now()
        newest = self._create_event(occurred_at=now)
        older = self._create_event(occurred_at=now - timedelta(minutes=1))
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url, {"page_size": 1})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([row["id"] for row in response.data["results"]], [newest.id])
        self.assertIsNotNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

        cursor = parse_qs(urlparse(response.data["next"]).query)["cursor"][0]
        next_response = self.client.get(self.url, {"page_size": 1, "cursor": cursor})

        self.assertEqual(next_response.status_code, status.HTTP_200_OK)
        self.assertEqual([row["id"] for row in next_response.data["results"]], [older.id])
        self.assertIsNone(next_response.data["next"])
