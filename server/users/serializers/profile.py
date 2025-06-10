# users/serializers/profile.py
from rest_framework import serializers
from users.models.profile import Profile, ProfileInterest, ProfileSocialLink
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