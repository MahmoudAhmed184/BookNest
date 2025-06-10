# users/views/register.py
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView
from users.serializers.auth_serializer import CustomRegisterSerializer, CustomLoginSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomRegisterView(RegisterView):
    serializer_class = CustomRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Create a new user account
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            response_data = {
                "success": True,
                "message": "Registration successful",
                "data": {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                    "access": access_token,
                    "refresh": refresh_token
                },
                "meta": {
                    "next_action": "create_profile",
                    "profile_required": True
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
        
        # Format validation errors
        error_response = {
            "success": False,
            "message": "Registration failed",
            "errors": self._format_validation_errors(serializer.errors)
        }
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
    
    def _format_validation_errors(self, errors):
        """Format validation errors for consistent response"""
        formatted_errors = {}
        for field, error_list in errors.items():
            if isinstance(error_list, list):
                formatted_errors[field] = error_list[0] if error_list else None
            else:
                formatted_errors[field] = str(error_list)
        return formatted_errors


class CustomLoginView(LoginView):
    serializer_class = CustomLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Login user with email and password
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Check if user has a profile
            has_profile = hasattr(user, 'profile')
            
            # Get the login response from parent
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Customize the response data
                original_data = response.data
                access_token = original_data.get('access')
                refresh_token = original_data.get('refresh')
                
                response_data = {
                    "success": True,
                    "message": "Login successful",
                    "data": {
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "has_profile": has_profile
                        },
                    'access': access_token,
                    'refresh': refresh_token
                       
                    },
                    "meta": {
                        "profile_required": not has_profile,
                        "next_action": "create_profile" if not has_profile else None
                    }
                }
                response.data = response_data
            
            return response
        
        # Format validation errors
        error_response = {
            "success": False,
            "message": "Login failed",
            "errors": self._format_validation_errors(serializer.errors)
        }
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
    
    def _format_validation_errors(self, errors):
        """Format validation errors for consistent response"""
        formatted_errors = {}
        for field, error_list in errors.items():
            if isinstance(error_list, list):
                formatted_errors[field] = error_list[0] if error_list else None
            else:
                formatted_errors[field] = str(error_list)
        return formatted_errors


class CustomLogoutView(LogoutView):
    """
    Custom logout view with token blacklisting
    """
    def post(self, request, *args, **kwargs):
        """
        Logout user and blacklist refresh token
        """
        try:
            # Get refresh token from request
            refresh_token = request.data.get('refresh')
            
            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            else:
                # If no refresh token provided, blacklist all user tokens
                if request.user.is_authenticated:
                    tokens = OutstandingToken.objects.filter(user=request.user)
                    for token in tokens:
                        try:
                            BlacklistedToken.objects.get_or_create(token=token)
                        except Exception:
                            pass  # Token might already be blacklisted
            
            response_data = {
                "success": True,
                "message": "Logout successful",
                "data": None
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            error_response = {
                "success": False,
                "message": "Logout failed",
                "errors": {"detail": str(e)}
            }
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)