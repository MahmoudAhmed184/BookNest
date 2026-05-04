from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.timesince import timesince
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import extend_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import NotFound
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.books.models import Author, Book, Genre
from apps.books.serializers.book import (
    AuthorSerializer,
    BookGenreSerializer,
    BookSerializer,
)


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


def _positive_int(value, default, maximum):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default

    return min(max(1, parsed), maximum)


class BookCollectionAPIView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
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

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return []


class BookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return []


class RelatedBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer

    def get_queryset(self):
        book = get_object_or_404(
            Book.objects.prefetch_related("authors", "genres"),
            pk=self.kwargs.get("book_id"),
        )
        limit = _positive_int(self.request.query_params.get("limit"), default=8, maximum=24)
        author_ids = book.authors.values_list("author_id", flat=True)
        genre_ids = book.genres.values_list("id", flat=True)

        return (
            Book.objects.prefetch_related("authors", "genres")
            .filter(Q(authors__author_id__in=author_ids) | Q(genres__id__in=genre_ids))
            .exclude(isbn13=book.isbn13)
            .distinct()
            .order_by("-average_rate", "title")[:limit]
        )


class FeedActivityListAPIView(APIView):
    @extend_schema(responses=FeedActivitySerializer(many=True))
    def get(self, request):
        from apps.books.models import BookRating, BookReview

        limit = _positive_int(request.query_params.get("limit"), default=20, maximum=50)
        reviews = (
            BookReview.objects.select_related("user", "book")
            .order_by("-created_at")[:limit]
        )
        ratings = (
            BookRating.objects.select_related("user", "book")
            .order_by("-created_at")[:limit]
        )
        activities = []

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

    def _relative_timestamp(self, value):
        if not value:
            return "Recently"

        return f"{timesince(value, timezone.now()).split(',')[0]} ago"


class AuthorListAPIView(generics.ListAPIView):
    schema = AutoSchema()
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'name': ['icontains'],
        'number_of_books': ['gte', 'lte'],
    }
    pagination_class = LimitOffsetPagination


class AuthorDetailAPIView(generics.RetrieveAPIView):
    schema = AutoSchema()
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer


class AuthorBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'authors__name': ['icontains' , 'in'],
        'genres__name': ['icontains', 'in', 'exact'],
        'average_rate': ['gte', 'lte'],
        'description': ['icontains'],
        'publication_date': ['exact', 'year', 'month', 'day', 'range'],
        'number_of_pages': ['gte', 'lte', 'exact'],
        'title': ['exact', 'icontains', 'istartswith'],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        author_id = self.kwargs.get('pk')
        author_name = self.kwargs.get('name')
        queryset = Book.objects.all().prefetch_related('authors')

        if author_id:
            queryset = queryset.filter(authors__author_id=author_id)
        elif author_name:
            queryset = queryset.filter(authors__name__icontains=author_name)
        else:
            raise NotFound("Provide either author ID or name")

        queryset = queryset.distinct()

        return queryset


class GenreListAPIView(generics.ListAPIView):
    schema = AutoSchema()
    queryset = Genre.objects.all()
    serializer_class = BookGenreSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'name': ['icontains', 'exact'],
    }
    pagination_class = LimitOffsetPagination


class GenreBookListAPIView(generics.ListAPIView):
    """
    API endpoint that returns books filtered by genre(s).
    Supports filtering by single genre or multiple genres.
    """
    schema = AutoSchema()
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'authors__name': ['icontains', 'in'],
        'average_rate': ['gte', 'lte'],
        'description': ['icontains'],
        'publication_date': ['exact', 'year', 'month', 'day', 'range'],
        'number_of_pages': ['gte', 'lte', 'exact'],
        'title': ['exact', 'icontains', 'istartswith'],
    }
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        genre_name = self.kwargs.get('name')
        genre_id = self.kwargs.get('pk')
        queryset = Book.objects.all().prefetch_related('genres')

        if genre_id:
            queryset = queryset.filter(genres__id=genre_id)
        elif genre_name:
            queryset = queryset.filter(genres__name__icontains=genre_name)
        else:
            raise NotFound("Provide either genre ID or name")

        return queryset.distinct()
