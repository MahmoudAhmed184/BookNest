from __future__ import annotations

import base64
import binascii
import json
from dataclasses import dataclass
from datetime import datetime
from typing import TYPE_CHECKING, Any

from django.utils import timezone
from django.utils.timesince import timesince
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.books.selectors import (
    author_queryset,
    book_catalog_queryset,
    book_resource_queryset,
    books_for_author,
    books_for_genre,
    genre_queryset,
    recent_ratings,
    recent_reviews,
    related_books_for_book,
)
from apps.books.serializers.book import (
    AuthorSerializer,
    BookGenreSerializer,
    BookSerializer,
)

if TYPE_CHECKING:
    from rest_framework.request import Request


class FeedActivityBookSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    cover = serializers.URLField(allow_blank=True, allow_null=True, required=False)


class FeedActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()
    action = serializers.CharField()
    timestamp = serializers.CharField()
    book = FeedActivityBookSerializer()


class FeedActivityPageSerializer(serializers.Serializer):
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = FeedActivitySerializer(many=True)


@dataclass(frozen=True)
class FeedCursor:
    created_at: datetime
    kind: str
    object_id: int


FEED_ACTIVITY_SOURCE_RANK = {
    "rating": 0,
    "review": 1,
}
FEED_ACTIVITY_DEFAULT_LIMIT = 20
FEED_ACTIVITY_MAX_LIMIT = 50
FEED_CURSOR_MAX_LENGTH = 512


def _positive_int(value: Any, default: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except TypeError, ValueError:
        return default

    return min(max(1, parsed), maximum)


def _decode_feed_cursor(value: str | None) -> FeedCursor | None:
    if not value:
        return None

    if len(value) > FEED_CURSOR_MAX_LENGTH:
        raise ValueError("Invalid feed cursor")

    padded_value = value + ("=" * (-len(value) % 4))

    try:
        decoded = base64.b64decode(padded_value.encode("ascii"), altchars=b"-_", validate=True)
        payload = json.loads(decoded.decode("utf-8"))
        created_at = datetime.fromisoformat(payload["created_at"])
        kind = str(payload["kind"])
        object_id = int(payload["id"])
    except (binascii.Error, json.JSONDecodeError, KeyError, TypeError, UnicodeDecodeError, ValueError) as exc:
        raise ValueError("Invalid feed cursor") from exc

    if kind not in FEED_ACTIVITY_SOURCE_RANK or object_id <= 0:
        raise ValueError("Invalid feed cursor")

    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())

    return FeedCursor(created_at=created_at, kind=kind, object_id=object_id)


class BookCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "authors__name": ["icontains", "in"],
        "genres__name": ["icontains", "in", "exact"],
        "average_rate": ["gte", "lte"],
        "description": ["icontains"],
        "publication_date": ["exact", "year", "month", "day", "range"],
        "number_of_pages": ["gte", "lte", "exact"],
        "title": ["exact", "icontains", "istartswith"],
    }
    pagination_class = LimitOffsetPagination

    def get_permissions(self) -> list[Any]:
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return []

    def get_queryset(self) -> Any:
        return book_catalog_queryset()


class BookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer

    def get_permissions(self) -> list[Any]:
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return []

    def get_queryset(self) -> Any:
        return book_resource_queryset()


class RelatedBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer

    def get_queryset(self) -> Any:
        limit = _positive_int(self.request.query_params.get("limit"), default=8, maximum=24)
        return related_books_for_book(book_id=self.kwargs.get("book_id"), limit=limit)


class FeedActivityListAPIView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter("limit", int, OpenApiParameter.QUERY),
            OpenApiParameter("cursor", str, OpenApiParameter.QUERY),
        ],
        responses={
            200: FeedActivityPageSerializer,
            400: OpenApiResponse(description="Invalid feed cursor."),
        },
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        limit = _positive_int(
            request.query_params.get("limit"),
            default=FEED_ACTIVITY_DEFAULT_LIMIT,
            maximum=FEED_ACTIVITY_MAX_LIMIT,
        )
        cursor_value = request.query_params.get("cursor")

        try:
            cursor = _decode_feed_cursor(cursor_value)
        except ValueError:
            return Response({"detail": "Invalid feed cursor"}, status=status.HTTP_400_BAD_REQUEST)

        query_limit = limit + 1
        cursor_created_at = cursor.created_at if cursor else None
        cursor_kind = cursor.kind if cursor else None
        cursor_object_id = cursor.object_id if cursor else None
        reviews = recent_reviews(
            limit=query_limit,
            cursor_created_at=cursor_created_at,
            cursor_kind=cursor_kind,
            cursor_object_id=cursor_object_id,
        )
        ratings = recent_ratings(
            limit=query_limit,
            cursor_created_at=cursor_created_at,
            cursor_kind=cursor_kind,
            cursor_object_id=cursor_object_id,
        )
        activities: list[dict[str, Any]] = []

        for review in reviews:
            activities.append(
                {
                    "id": f"review-{review.review_id}",
                    "kind": "review",
                    "object_id": review.review_id,
                    "source_rank": FEED_ACTIVITY_SOURCE_RANK["review"],
                    "username": review.user.username,
                    "action": "reviewed",
                    "timestamp": self._relative_timestamp(review.created_at),
                    "created_at": review.created_at,
                    "book": {
                        "id": review.book.isbn13,
                        "title": review.book.title,
                        "cover": review.book.cover_img,
                    },
                }
            )

        for rating in ratings:
            activities.append(
                {
                    "id": f"rating-{rating.rate_id}",
                    "kind": "rating",
                    "object_id": rating.rate_id,
                    "source_rank": FEED_ACTIVITY_SOURCE_RANK["rating"],
                    "username": rating.user.username,
                    "action": f"rated {rating.rate:g}/5",
                    "timestamp": self._relative_timestamp(rating.created_at),
                    "created_at": rating.created_at,
                    "book": {
                        "id": rating.book.isbn13,
                        "title": rating.book.title,
                        "cover": rating.book.cover_img,
                    },
                }
            )

        activities.sort(key=self._activity_sort_key, reverse=True)
        page_activities = activities[:limit]
        has_next_page = len(activities) > limit
        next_url = self._next_url(request, page_activities[-1], limit) if has_next_page and page_activities else None

        return Response(
            {
                "next": next_url,
                "previous": None,
                "results": [self._serialize_activity(activity) for activity in page_activities],
            }
        )

    def _relative_timestamp(self, value: Any) -> str:
        if not value:
            return "Recently"

        return f"{timesince(value, timezone.now()).split(',')[0]} ago"

    def _activity_sort_key(self, activity: dict[str, Any]) -> tuple[Any, Any, Any]:
        return activity["created_at"], activity["source_rank"], activity["object_id"]

    def _serialize_activity(self, activity: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": activity["id"],
            "username": activity["username"],
            "action": activity["action"],
            "timestamp": activity["timestamp"],
            "book": activity["book"],
        }

    def _next_url(self, request: Request, activity: dict[str, Any], limit: int) -> str:
        query_params = request.query_params.copy()
        query_params["limit"] = str(limit)
        query_params["cursor"] = self._encode_cursor(activity)
        return request.build_absolute_uri(f"{request.path}?{query_params.urlencode()}")

    def _encode_cursor(self, activity: dict[str, Any]) -> str:
        payload = {
            "created_at": activity["created_at"].isoformat(),
            "kind": activity["kind"],
            "id": activity["object_id"],
        }
        encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")).decode("ascii")
        return encoded.rstrip("=")


class AuthorListAPIView(generics.ListAPIView):
    schema = AutoSchema()
    serializer_class = AuthorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "name": ["icontains"],
        "number_of_books": ["gte", "lte"],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self) -> Any:
        return author_queryset()


class AuthorDetailAPIView(generics.RetrieveAPIView):
    schema = AutoSchema()
    serializer_class = AuthorSerializer

    def get_queryset(self) -> Any:
        return author_queryset()


class AuthorBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "authors__name": ["icontains", "in"],
        "genres__name": ["icontains", "in", "exact"],
        "average_rate": ["gte", "lte"],
        "description": ["icontains"],
        "publication_date": ["exact", "year", "month", "day", "range"],
        "number_of_pages": ["gte", "lte", "exact"],
        "title": ["exact", "icontains", "istartswith"],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self) -> Any:
        if getattr(self, "swagger_fake_view", False):
            return book_catalog_queryset().none()

        return books_for_author(author_id=self.kwargs.get("pk"), author_name=self.kwargs.get("name"))


class GenreListAPIView(generics.ListAPIView):
    schema = AutoSchema()
    serializer_class = BookGenreSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "name": ["icontains", "exact"],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self) -> Any:
        return genre_queryset()


class GenreBookListAPIView(generics.ListAPIView):
    """
    API endpoint that returns books filtered by genre(s).
    Supports filtering by single genre or multiple genres.
    """

    schema = AutoSchema()
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "authors__name": ["icontains", "in"],
        "average_rate": ["gte", "lte"],
        "description": ["icontains"],
        "publication_date": ["exact", "year", "month", "day", "range"],
        "number_of_pages": ["gte", "lte", "exact"],
        "title": ["exact", "icontains", "istartswith"],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self) -> Any:
        if getattr(self, "swagger_fake_view", False):
            return book_catalog_queryset().none()

        return books_for_genre(genre_id=self.kwargs.get("pk"), genre_name=self.kwargs.get("name"))
