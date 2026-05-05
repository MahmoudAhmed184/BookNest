from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.utils import timezone
from django.utils.timesince import timesince
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, serializers
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


def _positive_int(value: Any, default: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except TypeError, ValueError:
        return default

    return min(max(1, parsed), maximum)


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
    @extend_schema(responses=FeedActivitySerializer(many=True))
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        limit = _positive_int(request.query_params.get("limit"), default=20, maximum=50)
        reviews = recent_reviews(limit=limit)
        ratings = recent_ratings(limit=limit)
        activities: list[dict[str, Any]] = []

        for review in reviews:
            activities.append(
                {
                    "id": f"review-{review.review_id}",
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

        activities.sort(key=lambda activity: activity["created_at"], reverse=True)

        return Response(
            [
                {
                    "id": activity["id"],
                    "username": activity["username"],
                    "action": activity["action"],
                    "timestamp": activity["timestamp"],
                    "book": activity["book"],
                }
                for activity in activities[:limit]
            ]
        )

    def _relative_timestamp(self, value: Any) -> str:
        if not value:
            return "Recently"

        return f"{timesince(value, timezone.now()).split(',')[0]} ago"


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
        return books_for_genre(genre_id=self.kwargs.get("pk"), genre_name=self.kwargs.get("name"))
