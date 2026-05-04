# users/serializers/auth.py
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from allauth.account.adapter import get_adapter
from allauth.account.utils import filter_users_by_email
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomRegisterSerializer(RegisterSerializer):
    # Remove fields we don't want
    first_name = None
    last_name = None
    
    # Define fields we want
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password1 = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    
    def validate_email(self, email):
        """Validate email uniqueness"""
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(_("Email already exists."))
        return email
    
    def validate_username(self, username):
        """Validate username uniqueness"""
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError(_("Username in not avalible."))
        return username

    def get_cleaned_data(self):
        return {
            'username': self.validated_data.get('username', ''),
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
        }
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['password1'] != data['password2']:
            raise serializers.ValidationError({
                "password": _("The two password fields didn't match.")
            })
        return data




class CustomLoginSerializer(LoginSerializer):
    # Remove username field, use email only
    username = None
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def authenticate(self, **kwargs):
        """Custom authentication using email instead of username"""
        return authenticate(self.context['request'], **kwargs)

    def validate(self, attrs):
        email = attrs.get('email').lower()
        password = attrs.get('password')

        if email and password:
            # Try to find user by email
            try:
                user = User.objects.get(email=email)
                # Authenticate using the user's username and password
                user_authenticated = authenticate(
                    request=self.context.get('request'),
                    username=user.username,  # Django's authenticate still uses username
                    password=password
                )
                
                if not user_authenticated:
                    msg = _('Unable to log in with provided credentials.')
                    raise serializers.ValidationError(msg, code='authorization')
                    
                if not user_authenticated.is_active:
                    msg = _('User account is disabled.')
                    raise serializers.ValidationError(msg, code='authorization')
                    
                attrs['user'] = user_authenticated
                return attrs
                
            except User.DoesNotExist:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

# users/serializers/profile.py
from rest_framework import serializers
from apps.users.models.profile import Profile, ProfileInterest, ProfileSocialLink
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError

class ProfileInterestSerializer(serializers.ModelSerializer):
    """Serializer for profile interests"""
    
    class Meta:
        model = ProfileInterest
        fields = ['interest']
        
    def validate_interest(self, value):
        """Validate interest field"""
        if not value.strip():
            raise serializers.ValidationError("Interest cannot be empty")
        return value.strip().title()


class ProfileSocialLinkSerializer(serializers.ModelSerializer):
    """Serializer for profile social links"""
    
    class Meta:
        model = ProfileSocialLink
        fields = ['platform', 'url']
        
    def validate_url(self, value):
        """Validate URL format"""
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value


class ProfileSerializer(serializers.ModelSerializer):
    """Enhanced serializer for user profiles"""
    
    interests = ProfileInterestSerializer(many=True, required=False)
    social_links = ProfileSocialLinkSerializer(many=True, required=False)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    profile_pic = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    updated_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    

    class Meta:
        model = Profile
        fields = [
            'id', 'user_id', 'username', 'email', 'full_name', 'profile_pic', 'bio', 
            'profile_type', 'interests', 'social_links', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def get_profile_pic(self, obj):
        """Get profile picture URL with proper formatting"""
        if obj.profile_pic:
            # Convert Cloudinary field to string and clean URL
            url = str(obj.profile_pic)
            
            # Remove 'image/upload/' prefix if present
            if url.startswith('image/upload/'):
                url = url.replace('image/upload/', '', 1)
            
            # Ensure HTTPS
            if url.startswith('http://'):
                url = url.replace('http://', 'https://', 1)
                
            return url
        return None

    def get_full_name(self, obj):
        """Get user's full name if available"""
        user = obj.user
        if user.first_name or user.last_name:
            return f"{user.first_name} {user.last_name}".strip()
        return None

    # def validate_bio(self, value):
    #     """Validate bio field"""
    #     if value and len(value.strip()) < 10:
    #         raise serializers.ValidationError("Bio must be at least 10 characters long")
    #     return value.strip() if value else value

    def validate_interests(self, value):
        """Validate interests list"""
        if value and len(value) > 10:
            raise serializers.ValidationError("Maximum 10 interests allowed")
        
        # Check for duplicate interests
        interests = [item['interest'].lower() for item in value if 'interest' in item]
        if len(interests) != len(set(interests)):
            raise serializers.ValidationError("Duplicate interests are not allowed")
            
        return value

    def validate_social_links(self, value):
        """Validate social links"""
        if value and len(value) > 6:
            raise serializers.ValidationError("Maximum 6 social links allowed")
            
        # Check for duplicate platforms
        platforms = [item['platform'] for item in value if 'platform' in item]
        if len(platforms) != len(set(platforms)):
            raise serializers.ValidationError("Duplicate platforms are not allowed")
            
        return value

    def create(self, validated_data):
        """Create profile with nested relationships"""
        interests_data = validated_data.pop('interests', [])
        social_links_data = validated_data.pop('social_links', [])
        
        # Create profile
        profile = Profile.objects.create(**validated_data)
        
        # Create interests
        for interest_data in interests_data:
            ProfileInterest.objects.create(profile=profile, **interest_data)
            
        # Create social links
        for link_data in social_links_data:
            ProfileSocialLink.objects.create(profile=profile, **link_data)
            
        return profile

    def update(self, instance, validated_data):
        """Update profile with nested relationships"""
        # Handle nested interests
        interests_data = validated_data.pop('interests', None)
        if interests_data is not None:
            # Clear existing interests and create new ones
            instance.interests.all().delete()
            for interest_data in interests_data:
                ProfileInterest.objects.create(profile=instance, **interest_data)

        # Handle nested social links
        social_links_data = validated_data.pop('social_links', None)
        if social_links_data is not None:
            # Clear existing social links and create new ones
            instance.social_links.all().delete()
            for link_data in social_links_data:
                ProfileSocialLink.objects.create(profile=instance, **link_data)

        # Update the remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

    def to_representation(self, instance):
        """Customize the serialized output"""
        data = super().to_representation(instance)
        
        # Add computed fields
        data['interests_count'] = instance.interests.count()
        data['social_links_count'] = instance.social_links.count()
        data['is_complete'] = self._is_profile_complete(instance)
        
        return data

    def _is_profile_complete(self, instance):
        """Check if profile is considered complete"""
        required_fields = ['bio', 'profile_pic']
        
        for field in required_fields:
            if not getattr(instance, field):
                return False
                
        # Check if at least one interest exists
        if instance.interests.count() == 0:
            return False
            
        return True


class ProfileCreateSerializer(ProfileSerializer):
    """Simplified serializer for profile creation"""
    
    class Meta(ProfileSerializer.Meta):
        fields = [
            'bio', 'profile_type', 'interests', 'social_links'
        ]
        
    def validate(self, data):
        """Additional validation for profile creation"""
        # Ensure required fields for profile creation
        if not data.get('bio'):
            raise serializers.ValidationError({
                'bio': 'Bio is required when creating a profile'
            })
            
        return data


class ProfileUpdateSerializer(ProfileSerializer):
    """Serializer for profile updates with more flexibility"""
    
    class Meta(ProfileSerializer.Meta):
        fields = [
            'bio', 'profile_type', 'interests', 'social_links'
        ]
        
    def validate_bio(self, value):
        """More lenient bio validation for updates"""
        if value is not None and len(value.strip()) < 5:
            raise serializers.ValidationError("Bio must be at least 5 characters long")
        return value.strip() if value else value

# serializers.py
from rest_framework import serializers
from apps.users.models.profile import Profile, ProfileInterest, ProfileSocialLink
from apps.users.models.user import CustomUser
from apps.follows.models import Follow
from apps.books.models import (
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


class UserDataProfileInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileInterest
        fields = ['interest']


class UserDataProfileSocialLinkSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = ProfileSocialLink
        fields = ['platform', 'platform_display', 'url']


class ReadingListBooksSerializer(serializers.ModelSerializer):
    book = BookBasicSerializer(read_only=True)
    
    class Meta:
        model = ReadingListBooks
        fields = ['book']


class UserDataReadingListSerializer(serializers.ModelSerializer):
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


class UserDataBookRatingSerializer(serializers.ModelSerializer):
    book = BookBasicSerializer(read_only=True)
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = BookRating
        fields = ['rate_id', 'rate', 'created_at', 'book']
        read_only_fields = ['rate_id', 'created_at']


class UserDataBookReviewSerializer(serializers.ModelSerializer):
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


class UserDataProfileSerializer(serializers.ModelSerializer):
    interests = UserDataProfileInterestSerializer(many=True, read_only=True)
    social_links = UserDataProfileSocialLinkSerializer(many=True, read_only=True)
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
    profile = UserDataProfileSerializer(read_only=True)
    reading_lists = UserDataReadingListSerializer(source='profile.reading_lists', many=True, read_only=True)
    ratings = UserDataBookRatingSerializer(many=True, read_only=True)
    reviews = UserDataBookReviewSerializer(many=True, read_only=True)
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
