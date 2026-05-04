# users/serializers/auth_serializer.py
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