from typing import TYPE_CHECKING

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.books.models import Book
from apps.reviews import selectors, services
from apps.reviews.models import ReviewVote
from apps.reviews.serializers import RatingSerializer, ReviewSerializer, ReviewVoteSerializer

if TYPE_CHECKING:
    from apps.reviews.models import Rating, Review


class RatingCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        book_id = self.kwargs.get("book_id")
        if book_id is not None:
            return selectors.ratings_for_book(book_id=book_id)
        if self.request.query_params.get("mine") == "true":
            return selectors.ratings_for_user(user=self.request.user)
        return selectors.rating_queryset()

    def perform_create(self, serializer):
        book = serializer.validated_data.get("book")
        if "book_id" in self.kwargs:
            book = generics.get_object_or_404(Book.objects.visible(), id=self.kwargs["book_id"])
        if book is None:
            raise ValidationError({"book": "This field is required."})
        rating = services.create_or_update_rating(
            user=self.request.user,
            book=book,
            value=serializer.validated_data["value"],
        )
        serializer.instance = rating


class RatingResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.ratings_for_user(user=self.request.user)

    def perform_update(self, serializer):
        rating = serializer.save()
        services.sync_book_rating_stats(book=rating.book)

    def perform_destroy(self, instance: Rating) -> None:
        services.archive_rating(rating=instance)


class ReviewCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        book_id = self.kwargs.get("book_id")
        if book_id is not None:
            return selectors.reviews_for_book(book_id=book_id)
        if self.request.query_params.get("mine") == "true":
            return selectors.reviews_for_user(user=self.request.user)
        return selectors.review_queryset()

    def perform_create(self, serializer):
        validated_data = dict(serializer.validated_data)
        if "book_id" in self.kwargs:
            validated_data["book"] = generics.get_object_or_404(Book.objects.visible(), id=self.kwargs["book_id"])
        if "book" not in validated_data:
            raise ValidationError({"book": "This field is required."})
        review = services.create_review(user=self.request.user, **validated_data)
        serializer.instance = review


class ReviewResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.reviews_for_user(user=self.request.user)

    def perform_update(self, serializer):
        review = serializer.save(is_edited=True, edited_at=timezone.now())
        services.sync_book_review_count(book=review.book)

    def perform_destroy(self, instance: Review) -> None:
        services.archive_review(review=instance)


class ReviewVoteCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewVoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReviewVote.objects.select_related("user", "review", "review__book").filter(user=self.request.user)

    def perform_create(self, serializer):
        vote = services.set_review_vote(
            user=self.request.user,
            review=serializer.validated_data["review"],
            vote_type=serializer.validated_data["vote_type"],
        )
        serializer.instance = vote


class ReviewVoteResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewVoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReviewVote.objects.select_related("user", "review", "review__book").filter(user=self.request.user)

    def perform_update(self, serializer):
        vote = serializer.save()
        services.sync_review_vote_counts(review=vote.review)

    def perform_destroy(self, instance: ReviewVote) -> None:
        services.delete_review_vote(user=self.request.user, review=instance.review)


class ReviewVoteAPIView(generics.GenericAPIView):
    serializer_class = ReviewVoteSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id: int):
        review = generics.get_object_or_404(selectors.review_queryset(), id=review_id)
        serializer = ReviewVoteSerializer(data={"review": review.id, "vote_type": request.data.get("vote_type")})
        serializer.is_valid(raise_exception=True)
        vote = services.set_review_vote(
            user=request.user,
            review=review,
            vote_type=serializer.validated_data["vote_type"],
        )
        return Response(ReviewVoteSerializer(vote).data, status=status.HTTP_200_OK)

    def delete(self, request, review_id: int):
        review = generics.get_object_or_404(selectors.review_queryset(), id=review_id)
        services.delete_review_vote(user=request.user, review=review)
        return Response(status=status.HTTP_204_NO_CONTENT)
