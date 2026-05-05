from __future__ import annotations

from typing import TYPE_CHECKING, Any

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.books.selectors import (
    rating_list,
    ratings_for_book,
    ratings_for_user,
    review_list,
    review_queryset,
    reviews_for_book,
    reviews_for_user,
    user_rating_for_book,
)
from apps.books.serializers.review import BookRatingSerializer, BookReviewSerializer
from apps.books.services import create_rating, create_review, delete_rating, update_rating

if TYPE_CHECKING:
    from rest_framework.request import Request


class BookReviewCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookReviewSerializer

    def get_permissions(self) -> list[Any]:
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self) -> Any:
        sort_by = self.request.query_params.get("sort_by", "created_at")
        order = self.request.query_params.get("order", "desc")
        return review_list(sort_by=sort_by, order=order)

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        book_id = request.data.get("book")
        if not book_id:
            return Response(
                {"error": "Book ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        create_review(user=request.user, book_id=book_id, serializer=serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookReviewResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookReviewSerializer
    lookup_field = "review_id"

    def get_permissions(self) -> list[Any]:
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self) -> Any:
        queryset = review_queryset()
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return queryset.for_user(self.request.user)
        return queryset

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class BookRatingCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookRatingSerializer

    def get_permissions(self) -> list[Any]:
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self) -> Any:
        return rating_list()

    def perform_create(self, serializer: BookRatingSerializer) -> None:
        book_id = self.request.data.get("book")
        create_rating(user=self.request.user, book_id=book_id, serializer=serializer)


class BookRatingResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookRatingSerializer
    lookup_field = "rate_id"

    def get_permissions(self) -> list[Any]:
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self) -> Any:
        queryset = rating_list()
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return queryset.for_user(self.request.user)
        return queryset

    def perform_update(self, serializer: BookRatingSerializer) -> None:
        update_rating(serializer=serializer)

    def perform_destroy(self, instance: Any) -> None:
        delete_rating(rating=instance)


class BookReviewsByBookAPIView(generics.ListAPIView):
    """
    API endpoint that allows reviews for a specific book to be viewed.
    Supports sorting by creation date or upvotes.
    """

    serializer_class = BookReviewSerializer

    def get_queryset(self) -> Any:
        book_id = self.kwargs.get("book_id")
        sort_by = self.request.query_params.get("sort_by", "created_at")
        order = self.request.query_params.get("order", "desc")
        return reviews_for_book(book_id=book_id, sort_by=sort_by, order=order)

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class BookRatingsByBookAPIView(generics.ListAPIView):
    """
    API endpoint that allows ratings for a specific book to be viewed.
    """

    serializer_class = BookRatingSerializer

    def get_queryset(self) -> Any:
        book_id = self.kwargs.get("book_id")
        return ratings_for_book(book_id=book_id)


class UserBookRatingAPIView(generics.RetrieveAPIView):
    """
    API endpoint that allows a user to view their own rating for a specific book.
    Requires authentication.
    """

    serializer_class = BookRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> Any:
        book_id = self.kwargs.get("book_id")
        return user_rating_for_book(user=self.request.user, book_id=book_id)


class UserRatingsAPIView(generics.ListAPIView):
    """
    API endpoint that allows retrieving all ratings submitted by a specific user.
    If requesting user is authenticated and looking at their own ratings,
    all their ratings are returned. Otherwise, only public ratings are returned.
    """

    serializer_class = BookRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        user_id = self.kwargs.get("user_id")
        return ratings_for_user(user_id=user_id)


class UserReviewsAPIView(generics.ListAPIView):
    """
    API endpoint that allows retrieving all reviews submitted by a specific user.
    Returns all reviews for the specified user, ordered by creation date.
    """

    serializer_class = BookReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        user_id = self.kwargs.get("user_id")
        return reviews_for_user(user_id=user_id)
