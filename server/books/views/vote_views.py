from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from books.models import BookReview, ReviewVote
from books.serializers.review_serializers import ReviewVoteSerializer, BookReviewSerializer


class ReviewVoteCreateAPIView(generics.CreateAPIView):
    """
    Create a vote (upvote or downvote) for a review.
    
    POST /api/books/reviews/{review_id}/vote/
    Body: {"vote_type": "upvote" or "downvote"}
    """
    serializer_class = ReviewVoteSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, review_id):
        review = get_object_or_404(BookReview, review_id=review_id)
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['upvote', 'downvote']:
            return Response(
                {'error': 'vote_type must be either "upvote" or "downvote"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is trying to vote on their own review
        if review.user == request.user:
            return Response(
                {'error': 'You cannot vote on your own review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has already voted on this review
        existing_vote = ReviewVote.objects.filter(user=request.user, review=review).first()
        
        if existing_vote:
            if existing_vote.vote_type == vote_type:
                return Response(
                    {'error': f'You have already {vote_type}d this review'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Update existing vote
                existing_vote.vote_type = vote_type
                existing_vote.save()
                review.refresh_from_db()
                
                return Response({
                    'message': f'Vote updated to {vote_type}',
                    'vote_type': vote_type,
                    'upvotes_count': review.upvotes_count,
                    'downvotes_count': review.downvotes_count,
                    'net_votes': review.upvotes_count - review.downvotes_count
                }, status=status.HTTP_200_OK)
        
        # Create new vote
        vote_data = {
            'user': request.user.id,
            'review': review.review_id,
            'vote_type': vote_type
        }
        
        serializer = self.get_serializer(data=vote_data)
        if serializer.is_valid():
            serializer.save()
            review.refresh_from_db()
            
            return Response({
                'message': f'Review {vote_type}d successfully',
                'vote_type': vote_type,
                'upvotes_count': review.upvotes_count,
                'downvotes_count': review.downvotes_count,
                'net_votes': review.upvotes_count - review.downvotes_count
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewVoteDeleteAPIView(generics.DestroyAPIView):
    """
    Remove a vote from a review.
    
    DELETE /api/books/reviews/{review_id}/vote/remove/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, review_id):
        review = get_object_or_404(BookReview, review_id=review_id)
        
        try:
            vote = ReviewVote.objects.get(user=request.user, review=review)
            vote_type = vote.vote_type
            vote.delete()
            review.refresh_from_db()
            
            return Response({
                'message': f'{vote_type.capitalize()} removed successfully',
                'upvotes_count': review.upvotes_count,
                'downvotes_count': review.downvotes_count,
                'net_votes': review.upvotes_count - review.downvotes_count
            }, status=status.HTTP_200_OK)
        
        except ReviewVote.DoesNotExist:
            return Response(
                {'error': 'You have not voted on this review'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ReviewVoteToggleAPIView(generics.GenericAPIView):
    """
    Toggle vote on a review (upvote <-> downvote or remove vote).
    
    POST /api/books/reviews/{review_id}/vote/toggle/
    Body: {"vote_type": "upvote" or "downvote"}
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, review_id):
        review = get_object_or_404(BookReview, review_id=review_id)
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['upvote', 'downvote']:
            return Response(
                {'error': 'vote_type must be either "upvote" or "downvote"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is trying to vote on their own review
        if review.user == request.user:
            return Response(
                {'error': 'You cannot vote on your own review'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing_vote = ReviewVote.objects.filter(user=request.user, review=review).first()
        
        if existing_vote:
            if existing_vote.vote_type == vote_type:
                # Remove the vote if it's the same type
                existing_vote.delete()
                review.refresh_from_db()
                
                return Response({
                    'message': f'{vote_type.capitalize()} removed',
                    'vote_type': None,
                    'upvotes_count': review.upvotes_count,
                    'downvotes_count': review.downvotes_count,
                    'net_votes': review.upvotes_count - review.downvotes_count
                }, status=status.HTTP_200_OK)
            else:
                # Change vote type
                existing_vote.vote_type = vote_type
                existing_vote.save()
                review.refresh_from_db()
                
                return Response({
                    'message': f'Vote changed to {vote_type}',
                    'vote_type': vote_type,
                    'upvotes_count': review.upvotes_count,
                    'downvotes_count': review.downvotes_count,
                    'net_votes': review.upvotes_count - review.downvotes_count
                }, status=status.HTTP_200_OK)
        else:
            # Create new vote
            ReviewVote.objects.create(
                user=request.user,
                review=review,
                vote_type=vote_type
            )
            review.refresh_from_db()
            
            return Response({
                'message': f'Review {vote_type}d successfully',
                'vote_type': vote_type,
                'upvotes_count': review.upvotes_count,
                'downvotes_count': review.downvotes_count,
                'net_votes': review.upvotes_count - review.downvotes_count
            }, status=status.HTTP_201_CREATED)


class ReviewVoteStatusAPIView(generics.RetrieveAPIView):
    """
    Get the current user's vote status for a review.
    
    GET /api/books/reviews/{review_id}/vote/status/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, review_id):
        review = get_object_or_404(BookReview, review_id=review_id)
        
        vote = ReviewVote.objects.filter(user=request.user, review=review).first()
        
        return Response({
            'review_id': review.review_id,
            'user_vote_type': vote.vote_type if vote else None,
            'has_upvoted': vote.vote_type == 'upvote' if vote else False,
            'has_downvoted': vote.vote_type == 'downvote' if vote else False,
            'upvotes_count': review.upvotes_count,
            'downvotes_count': review.downvotes_count,
            'net_votes': review.upvotes_count - review.downvotes_count
        }, status=status.HTTP_200_OK)


class ReviewsByVotesAPIView(generics.ListAPIView):
    """
    Get reviews sorted by vote metrics.
    
    GET /api/books/reviews/by-votes/
    Query parameters:
    - sort_by: 'upvotes', 'downvotes', 'net_votes', 'controversial' (default: 'net_votes')
    - order: 'asc', 'desc' (default: 'desc')
    - book_id: filter by specific book (optional)
    """
    serializer_class = BookReviewSerializer
    
    def get_queryset(self):
        sort_by = self.request.query_params.get('sort_by', 'net_votes')
        order = self.request.query_params.get('order', 'desc')
        book_id = self.request.query_params.get('book_id')
        
        queryset = BookReview.objects.all()
        
        if book_id:
            queryset = queryset.filter(book__isbn13=book_id)
        
        # Add net_votes annotation
        queryset = queryset.annotate(
            net_votes=F('upvotes_count') - F('downvotes_count')
        )
        
        # Determine sorting field
        if sort_by == 'upvotes':
            sort_field = 'upvotes_count'
        elif sort_by == 'downvotes':
            sort_field = 'downvotes_count'
        elif sort_by == 'net_votes':
            sort_field = 'net_votes'
        elif sort_by == 'controversial':
            # Sort by total votes (upvotes + downvotes) descending, then by net votes ascending
            queryset = queryset.annotate(
                total_votes=F('upvotes_count') + F('downvotes_count')
            )
            if order == 'desc':
                return queryset.order_by('-total_votes', 'net_votes')
            else:
                return queryset.order_by('total_votes', '-net_votes')
        else:
            sort_field = 'net_votes'
        
        # Apply ordering
        if order == 'desc':
            sort_field = f'-{sort_field}'
        
        return queryset.order_by(sort_field)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class TopReviewsAPIView(generics.ListAPIView):
    """
    Get top-rated reviews based on net votes.
    
    GET /api/books/reviews/top/
    Query parameters:
    - limit: number of reviews to return (default: 10, max: 50)
    - min_votes: minimum number of total votes required (default: 1)
    - book_id: filter by specific book (optional)
    """
    serializer_class = BookReviewSerializer
    
    def get_queryset(self):
        limit = min(int(self.request.query_params.get('limit', 10)), 50)
        min_votes = int(self.request.query_params.get('min_votes', 1))
        book_id = self.request.query_params.get('book_id')
        
        queryset = BookReview.objects.annotate(
            net_votes=F('upvotes_count') - F('downvotes_count'),
            total_votes=F('upvotes_count') + F('downvotes_count')
        ).filter(
            total_votes__gte=min_votes
        )
        
        if book_id:
            queryset = queryset.filter(book__isbn13=book_id)
        
        return queryset.order_by('-net_votes', '-total_votes')[:limit]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserVotedReviewsAPIView(generics.ListAPIView):
    """
    Get reviews that the current user has voted on.
    
    GET /api/books/reviews/user/voted/
    Query parameters:
    - vote_type: 'upvote', 'downvote', or 'all' (default: 'all')
    """
    serializer_class = BookReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vote_type = self.request.query_params.get('vote_type', 'all')
        
        user_votes = ReviewVote.objects.filter(user=self.request.user)
        
        if vote_type in ['upvote', 'downvote']:
            user_votes = user_votes.filter(vote_type=vote_type)
        
        review_ids = user_votes.values_list('review_id', flat=True)
        
        return BookReview.objects.filter(
            review_id__in=review_ids
        ).order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ReviewVoteStatsAPIView(generics.RetrieveAPIView):
    """
    Get detailed vote statistics for a review.
    
    GET /api/books/reviews/{review_id}/vote/stats/
    """
    
    def get(self, request, review_id):
        review = get_object_or_404(BookReview, review_id=review_id)
        
        # Get vote breakdown
        upvotes = ReviewVote.objects.filter(review=review, vote_type='upvote').count()
        downvotes = ReviewVote.objects.filter(review=review, vote_type='downvote').count()
        total_votes = upvotes + downvotes
        net_votes = upvotes - downvotes
        
        # Calculate percentages
        upvote_percentage = (upvotes / total_votes * 100) if total_votes > 0 else 0
        downvote_percentage = (downvotes / total_votes * 100) if total_votes > 0 else 0
        
        # Get user's vote if authenticated
        user_vote = None
        if request.user.is_authenticated:
            vote = ReviewVote.objects.filter(user=request.user, review=review).first()
            user_vote = vote.vote_type if vote else None
        
        return Response({
            'review_id': review.review_id,
            'upvotes_count': upvotes,
            'downvotes_count': downvotes,
            'total_votes': total_votes,
            'net_votes': net_votes,
            'upvote_percentage': round(upvote_percentage, 2),
            'downvote_percentage': round(downvote_percentage, 2),
            'user_vote_type': user_vote,
            'controversy_score': min(upvotes, downvotes) / max(upvotes, downvotes) if min(upvotes, downvotes) > 0 else 0
        }, status=status.HTTP_200_OK)