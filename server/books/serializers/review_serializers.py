from rest_framework import serializers
from books.models import BookReview, BookRating, ReviewUpvote, ReviewVote
from django.contrib.auth import get_user_model
from django.db.models import Exists, OuterRef

User = get_user_model()

class BookReviewSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    has_downvoted = serializers.SerializerMethodField()
    user_vote_type = serializers.SerializerMethodField()
    net_votes = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()
    profile_id = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    updated_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    book_cover = serializers.SerializerMethodField()
    
    class Meta:
        model = BookReview
        fields = [
            'review_id', 'review_text', 'created_at', 'updated_at', 
            'upvotes_count', 'downvotes_count', 'net_votes', 'user', 'book', 
            'username', 'book_title', 'has_upvoted', 'has_downvoted', 'user_vote_type',
            'profile_pic', 'profile_id', 'book_cover'
        ]
        read_only_fields = [
            'review_id', 'created_at', 'updated_at', 'upvotes_count', 'downvotes_count',
            'net_votes', 'username', 'book_title', 'has_upvoted', 'has_downvoted', 'user_vote_type',
            'profile_pic', 'profile_id', 'book_cover'
        ]
    
    def get_book_title(self, obj):
        return obj.book.title if obj.book else None
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_profile_pic(self, obj):
        """Get the user's profile picture URL"""
        if hasattr(obj.user, 'profile') and obj.user.profile.profile_pic:
            return str(obj.user.profile.profile_pic)
        return None
    
    def get_net_votes(self, obj):
        """Calculate net votes (upvotes - downvotes)"""
        return obj.upvotes_count - obj.downvotes_count
    
    def get_has_upvoted(self, obj):
        """Check if the current user has upvoted this review"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = ReviewVote.objects.filter(
                user=request.user, 
                review=obj
            ).first()
            return vote.vote_type == 'upvote' if vote else False
        return False
    
    def get_has_downvoted(self, obj):
        """Check if the current user has downvoted this review"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = ReviewVote.objects.filter(
                user=request.user, 
                review=obj
            ).first()
            return vote.vote_type == 'downvote' if vote else False
        return False
    
    def get_user_vote_type(self, obj):
        """Get the current user's vote type for this review"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = ReviewVote.objects.filter(
                user=request.user, 
                review=obj
            ).first()
            return vote.vote_type if vote else None
        return None
    
    def get_profile_id(self, obj):
        """Get the user's profile ID"""
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.id
        return None

    def get_book_cover(self, obj):
        """Get the book's cover image URL"""
        return obj.book.cover_img if obj.book else None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Remove user ID from the representation if not needed in response
        if 'user' in representation:
            representation.pop('user')
        return representation


class ReviewVoteSerializer(serializers.ModelSerializer):
    """Serializer for review votes (upvotes and downvotes)"""
    username = serializers.SerializerMethodField()
    review_text_preview = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    updated_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = ReviewVote
        fields = ['id', 'user', 'review', 'vote_type', 'created_at', 'updated_at', 'username', 'review_text_preview']
        read_only_fields = ['id', 'created_at', 'updated_at', 'username', 'review_text_preview']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_review_text_preview(self, obj):
        """Return a preview of the review text (first 100 characters)"""
        if obj.review and obj.review.review_text:
            return obj.review.review_text[:100] + '...' if len(obj.review.review_text) > 100 else obj.review.review_text
        return None
    
    def validate(self, data):
        """Validate vote data"""
        user = data.get('user')
        review = data.get('review')
        
        # Prevent users from voting on their own reviews
        if review and user and review.user == user:
            raise serializers.ValidationError("You cannot vote on your own review.")
        
        return data
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Remove user ID from the representation if not needed in response
        if 'user' in representation:
            representation.pop('user')
        return representation


class ReviewUpvoteSerializer(serializers.ModelSerializer):
    """Serializer for review upvotes (backward compatibility)"""
    username = serializers.SerializerMethodField()
    review_text_preview = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = ReviewUpvote
        fields = ['upvote_id', 'user', 'review', 'created_at', 'username', 'review_text_preview']
        read_only_fields = ['upvote_id', 'created_at', 'username', 'review_text_preview']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_review_text_preview(self, obj):
        """Return a preview of the review text (first 100 characters)"""
        if obj.review and obj.review.review_text:
            return obj.review.review_text[:100] + '...' if len(obj.review.review_text) > 100 else obj.review.review_text
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Remove user ID from the representation if not needed in response
        if 'user' in representation:
            representation.pop('user')
        return representation


class BookRatingSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    book_average_rate = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = BookRating
        fields = ['rate_id', 'rate', 'created_at', 'user', 'book', 'username', 'book_title', 'book_average_rate']
        read_only_fields = ['rate_id', 'created_at', 'username', 'book_title', 'book_average_rate']
    
    def get_book_title(self, obj):
        return obj.book.title if obj.book else None
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_book_average_rate(self, obj):
        return obj.book.average_rate if obj.book else None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Remove user ID from the representation if not needed in response
        if 'user' in representation:
            representation.pop('user')
        return representation
    
    def create(self, validated_data):
        # Get the book instance
        book = validated_data.get('book')
        user = validated_data.get('user')
        
        # Check if the user has already rated this book
        existing_rating = BookRating.objects.filter(user=user, book=book).first()
        
        if existing_rating:
            # Update existing rating
            existing_rating.rate = validated_data.get('rate')
            existing_rating.save()
            return existing_rating
        
        # Create new rating
        rating = BookRating.objects.create(**validated_data)
        
        # Update book's average rating and number of ratings
        book_ratings = BookRating.objects.filter(book=book)
        book.number_of_ratings = book_ratings.count()
        
        if book.number_of_ratings > 0:
            total_rating = sum(br.rate for br in book_ratings)
            book.average_rate = total_rating / book.number_of_ratings
        
        book.save()
        
        return rating
    
    def update(self, instance, validated_data):
        # Update the rating
        instance.rate = validated_data.get('rate', instance.rate)
        instance.save()
        
        # Update book's average rating
        book = instance.book
        book_ratings = BookRating.objects.filter(book=book)
        
        if book_ratings.exists():
            total_rating = sum(br.rate for br in book_ratings)
            book.average_rate = total_rating / book_ratings.count()
            book.save()
        
        return instance