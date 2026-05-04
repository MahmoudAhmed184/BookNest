from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.books.models import Book, BookRating, BookReview
from apps.books.serializers.review import BookRatingSerializer, BookReviewSerializer
from apps.books.selectors import ratings_for_book, review_list, reviews_for_book
from apps.books.services import create_rating, create_review, delete_rating, update_rating


class BookReviewCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self):
        sort_by = self.request.query_params.get("sort_by", "created_at")
        order = self.request.query_params.get("order", "desc")
        return review_list(sort_by=sort_by, order=order)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
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

    def get_permissions(self):
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self):
        queryset = BookReview.objects.with_related()
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return queryset.for_user(self.request.user)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class BookRatingCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookRatingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self):
        return BookRating.objects.with_related().order_by("-created_at")

    def perform_create(self, serializer):
        book_id = self.request.data.get("book")
        create_rating(user=self.request.user, book_id=book_id, serializer=serializer)


class BookRatingResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookRatingSerializer
    lookup_field = "rate_id"

    def get_permissions(self):
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self):
        queryset = BookRating.objects.with_related()
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return queryset.for_user(self.request.user)
        return queryset

    def perform_update(self, serializer):
        update_rating(serializer=serializer)

    def perform_destroy(self, instance):
        delete_rating(rating=instance)


class BookReviewsByBookAPIView(generics.ListAPIView):
    """
    API endpoint that allows reviews for a specific book to be viewed.
    Supports sorting by creation date or upvotes.
    """
    serializer_class = BookReviewSerializer

    def get_queryset(self):
        book_id = self.kwargs.get('book_id')
        sort_by = self.request.query_params.get('sort_by', 'created_at')
        order = self.request.query_params.get('order', 'desc')
        return reviews_for_book(book_id=book_id, sort_by=sort_by, order=order)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class BookRatingsByBookAPIView(generics.ListAPIView):
    """
    API endpoint that allows ratings for a specific book to be viewed.
    """
    serializer_class = BookRatingSerializer

    def get_queryset(self):
        book_id = self.kwargs.get('book_id')
        return ratings_for_book(book_id=book_id)


class UserBookRatingAPIView(generics.RetrieveAPIView):
    """
    API endpoint that allows a user to view their own rating for a specific book.
    Requires authentication.
    """
    serializer_class = BookRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        book_id = self.kwargs.get('book_id')
        try:
            book = Book.objects.get(isbn13=book_id)
            rating = BookRating.objects.filter(book=book, user=self.request.user).first()
            if not rating:
                raise ValidationError({'rating': 'You have not rated this book yet'})
            return rating
        except Book.DoesNotExist:
            raise ValidationError({'book': 'Book does not exist'})


class UserRatingsAPIView(generics.ListAPIView):
    """
    API endpoint that allows retrieving all ratings submitted by a specific user.
    If requesting user is authenticated and looking at their own ratings,
    all their ratings are returned. Otherwise, only public ratings are returned.
    """
    serializer_class = BookRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(get_user_model(), id=user_id)

        if self.request.user.id == int(user_id):
            return BookRating.objects.filter(user=user).order_by('-created_at')

        return BookRating.objects.filter(user=user).order_by('-created_at')


class UserReviewsAPIView(generics.ListAPIView):
    """
    API endpoint that allows retrieving all reviews submitted by a specific user.
    Returns all reviews for the specified user, ordered by creation date.
    """
    serializer_class = BookReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')

        try:
            user = get_user_model().objects.get(id=user_id)
            return BookReview.objects.filter(user=user).order_by('-created_at')
        except get_user_model().DoesNotExist:
            return BookReview.objects.none()
