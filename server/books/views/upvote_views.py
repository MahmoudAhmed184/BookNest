from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from books.models import BookReview, ReviewUpvote
from books.serializers.review_serializers import ReviewUpvoteSerializer, BookReviewSerializer

User = get_user_model()


class ReviewUpvoteCreateAPIView(APIView):
    """
    API endpoint to upvote a review.
    Creates an upvote if it doesn't exist, returns error if already upvoted.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, review_id):
        try:
            review = BookReview.objects.get(review_id=review_id)
        except BookReview.DoesNotExist:
            return Response(
                {'error': 'Review not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is trying to upvote their own review
        if review.user == request.user:
            return Response(
                {'error': 'You cannot upvote your own review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has already upvoted this review
        if ReviewUpvote.objects.filter(user=request.user, review=review).exists():
            return Response(
                {'error': 'You have already upvoted this review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the upvote
        upvote = ReviewUpvote.objects.create(user=request.user, review=review)
        serializer = ReviewUpvoteSerializer(upvote, context={'request': request})
        
        return Response(
            {
                'message': 'Review upvoted successfully',
                'upvote': serializer.data,
                'upvotes_count': review.upvotes_count
            }, 
            status=status.HTTP_201_CREATED
        )


class ReviewUpvoteDeleteAPIView(APIView):
    """
    API endpoint to remove an upvote from a review.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, review_id):
        try:
            review = BookReview.objects.get(review_id=review_id)
        except BookReview.DoesNotExist:
            return Response(
                {'error': 'Review not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            upvote = ReviewUpvote.objects.get(user=request.user, review=review)
            upvote.delete()
            
            # Refresh review to get updated upvotes_count
            review.refresh_from_db()
            
            return Response(
                {
                    'message': 'Upvote removed successfully',
                    'upvotes_count': review.upvotes_count
                }, 
                status=status.HTTP_200_OK
            )
        except ReviewUpvote.DoesNotExist:
            return Response(
                {'error': 'You have not upvoted this review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )



class ReviewUpvoteToggleAPIView(APIView):
    """
    API endpoint to toggle upvote on a review.
    If upvoted, removes the upvote. If not upvoted, adds an upvote.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, review_id):
        try:
            review = BookReview.objects.get(review_id=review_id)
        except BookReview.DoesNotExist:
            return Response(
                {'error': 'Review not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is trying to upvote their own review
        if review.user == request.user:
            return Response(
                {'error': 'You cannot upvote your own review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Try to get existing upvote
            upvote = ReviewUpvote.objects.get(user=request.user, review=review)
            # If exists, remove it
            upvote.delete()
            review.refresh_from_db()
            
            return Response(
                {
                    'message': 'Upvote removed',
                    'action': 'removed',
                    'upvoted': False,
                    'upvotes_count': review.upvotes_count
                }, 
                status=status.HTTP_200_OK
            )
        except ReviewUpvote.DoesNotExist:
            # If doesn't exist, create it
            upvote = ReviewUpvote.objects.create(user=request.user, review=review)
            review.refresh_from_db()
            
            return Response(
                {
                    'message': 'Review upvoted',
                    'action': 'added',
                    'upvoted': True,
                    'upvotes_count': review.upvotes_count
                }, 
                status=status.HTTP_201_CREATED
            )


class ReviewUpvoteStatusAPIView(APIView):
    """
    API endpoint to check if current user has upvoted a specific review.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, review_id):
        try:
            review = BookReview.objects.get(review_id=review_id)
        except BookReview.DoesNotExist:
            return Response(
                {'error': 'Review not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        has_upvoted = ReviewUpvote.objects.filter(
            user=request.user, 
            review=review
        ).exists()
        
        return Response(
            {
                'review_id': review_id,
                'has_upvoted': has_upvoted,
                'upvotes_count': review.upvotes_count
            }, 
            status=status.HTTP_200_OK
        )


class ReviewsByUpvotesAPIView(generics.ListAPIView):
    """
    API endpoint to get reviews sorted by upvote count.
    Supports filtering by book and ordering.
    """
    serializer_class = BookReviewSerializer
    
    def get_queryset(self):
        queryset = BookReview.objects.all()
        
        # Filter by book if provided
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book__isbn13=book_id)
        
        # Order by upvotes count (descending by default)
        order = self.request.query_params.get('order', 'desc')
        if order == 'asc':
            queryset = queryset.order_by('upvotes_count')
        else:
            queryset = queryset.order_by('-upvotes_count')
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class TopReviewsAPIView(generics.ListAPIView):
    """
    API endpoint to get top reviews (most upvoted).
    """
    serializer_class = BookReviewSerializer
    
    def get_queryset(self):
        # Get minimum upvotes threshold from query params (default: 1)
        min_upvotes = int(self.request.query_params.get('min_upvotes', 1))
        
        # Get limit from query params (default: 10)
        limit = int(self.request.query_params.get('limit', 10))
        
        # Filter by book if provided
        book_id = self.request.query_params.get('book_id')
        
        queryset = BookReview.objects.filter(upvotes_count__gte=min_upvotes)
        
        if book_id:
            queryset = queryset.filter(book__isbn13=book_id)
        
        return queryset.order_by('-upvotes_count', '-created_at')[:limit]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserUpvotedReviewsAPIView(generics.ListAPIView):
    """
    API endpoint to get reviews that the current user has upvoted.
    """
    serializer_class = BookReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get reviews that the current user has upvoted
        upvoted_review_ids = ReviewUpvote.objects.filter(
            user=self.request.user
        ).values_list('review_id', flat=True)
        
        return BookReview.objects.filter(
            review_id__in=upvoted_review_ids
        ).order_by('-upvotes_count')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context