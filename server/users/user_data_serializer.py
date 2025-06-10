# serializers.py
from rest_framework import serializers
from users.models.profile import Profile, ProfileInterest, ProfileSocialLink
from users.models.models import CustomUser
from follows.models import Follow
from books.models import (
    Book, Author, ReadingList, ReadingListBooks, 
    BookRating, BookReview, Genre
)


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['author_id', 'name', 'number_of_books']


class BookGenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['name']


class BookBasicSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    genres = BookGenreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Book
        fields = [
            'isbn13', 'isbn', 'title', 'cover_img', 'description',
            'publication_date', 'number_of_pages', 'number_of_ratings',
            'average_rate', 'authors', 'genres'
        ]


class ProfileInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileInterest
        fields = ['interest']


class ProfileSocialLinkSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = ProfileSocialLink
        fields = ['platform', 'platform_display', 'url']


class ReadingListBooksSerializer(serializers.ModelSerializer):
    book = BookBasicSerializer(read_only=True)
    
    class Meta:
        model = ReadingListBooks
        fields = ['book']


class ReadingListSerializer(serializers.ModelSerializer):
    books_detail = ReadingListBooksSerializer(source='reading_list_books', many=True, read_only=True)
    books_count = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    privacy_display = serializers.CharField(source='get_privacy_display', read_only=True)
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = ReadingList
        fields = [
            'list_id', 'name', 'type', 'type_display', 'privacy', 
            'privacy_display', 'created_at', 'books_count', 'books_detail'
        ]
        read_only_fields = ['list_id', 'created_at']
    
    def get_books_count(self, obj):
        return obj.reading_list_books.count()


class BookRatingSerializer(serializers.ModelSerializer):
    book = BookBasicSerializer(read_only=True)
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = BookRating
        fields = ['rate_id', 'rate', 'created_at', 'book']
        read_only_fields = ['rate_id', 'created_at']


class BookReviewSerializer(serializers.ModelSerializer):
    book = BookBasicSerializer(read_only=True)
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    book_cover = serializers.SerializerMethodField()
    
    class Meta:
        model = BookReview
        fields = ['review_id', 'review_text', 'created_at', 'book', 'book_cover']
        read_only_fields = ['review_id', 'created_at']
    
    def get_book_cover(self, obj):
        """Get the book's cover image URL"""
        return obj.book.cover_img if obj.book else None


class FollowingSerializer(serializers.ModelSerializer):
    followed_user = serializers.SerializerMethodField()
    followed_profile_pic = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['followed_user', 'followed_profile_pic', 'created_at']
        read_only_fields = ['followed_user', 'followed_profile_pic', 'created_at']
    
    def get_followed_user(self, obj):
        return {
            'id': obj.followed.user.id,
            'username': obj.followed.user.username,
            'email': obj.followed.user.email,
            'profile_type': obj.followed.get_profile_type_display()
        }
    
    def get_followed_profile_pic(self, obj):
        if obj.followed.profile_pic:
            return obj.followed.profile_pic.url
        return None


class FollowerSerializer(serializers.ModelSerializer):
    follower_user = serializers.SerializerMethodField()
    follower_profile_pic = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['follower_user', 'follower_profile_pic', 'created_at']
        read_only_fields = ['follower_user', 'follower_profile_pic', 'created_at']
    
    def get_follower_user(self, obj):
        return {
            'id': obj.follower.user.id,
            'username': obj.follower.user.username,
            'email': obj.follower.user.email,
            'profile_type': obj.follower.get_profile_type_display()
        }
    
    def get_follower_profile_pic(self, obj):
        if obj.follower.profile_pic:
            return obj.follower.profile_pic.url
        return None


class ProfileSerializer(serializers.ModelSerializer):
    interests = ProfileInterestSerializer(many=True, read_only=True)
    social_links = ProfileSocialLinkSerializer(many=True, read_only=True)
    profile_type_display = serializers.CharField(source='get_profile_type_display', read_only=True)
    following = FollowingSerializer(many=True, read_only=True)
    followers = FollowerSerializer(many=True, read_only=True)
    following_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    updated_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id','bio', 'profile_type', 'profile_type_display', 'profile_pic',
            'settings', 'created_at', 'updated_at', 'interests',
            'social_links', 'following', 'followers', 'following_count',
            'followers_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    
class UserDataSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    reading_lists = ReadingListSerializer(source='profile.reading_lists', many=True, read_only=True)
    ratings = BookRatingSerializer(many=True, read_only=True)
    reviews = BookReviewSerializer(many=True, read_only=True)
    total_books_rated = serializers.SerializerMethodField()
    total_books_reviewed = serializers.SerializerMethodField()
    total_reading_lists = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'profile',
            'reading_lists', 'ratings', 'reviews', 'total_books_rated',
            'total_books_reviewed', 'total_reading_lists'
        ]
    
    def get_total_books_rated(self, obj):
        return obj.ratings.count()
    
    def get_total_books_reviewed(self, obj):
        return obj.reviews.count()
    
    def get_total_reading_lists(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.reading_lists.count()
        return 0