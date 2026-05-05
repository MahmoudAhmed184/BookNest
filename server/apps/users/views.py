# users/views/register.py
import logging

from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView, PasswordResetConfirmView, PasswordResetView
from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated as DRFIsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models.profile import Profile
from apps.users.permissions import IsAuthenticated as ProfileIsAuthenticated
from apps.users.permissions import IsOwnerOrReadOnly
from apps.users.selectors import (
    get_user_data,
    profile_exists_for_user,
    profile_for_user,
    profile_list,
    user_data_queryset,
)
from apps.users.serializers import (
    CustomLoginSerializer,
    CustomRegisterSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    UserDataSerializer,
)
from apps.users.services import (
    create_profile,
    update_profile,
    upload_profile_picture,
    validate_profile_image,
)

User = get_user_model()
logger = logging.getLogger(__name__)


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
                    "refresh": refresh_token,
                },
                "meta": {"next_action": "create_profile", "profile_required": True},
            }

            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

        # Format validation errors
        error_response = {
            "success": False,
            "message": "Registration failed",
            "errors": self._format_validation_errors(serializer.errors),
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
            user = serializer.validated_data["user"]

            # Check if user has a profile
            has_profile = hasattr(user, "profile")

            # Get the login response from parent
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                # Customize the response data
                original_data = response.data
                access_token = original_data.get("access")
                refresh_token = original_data.get("refresh")

                response_data = {
                    "success": True,
                    "message": "Login successful",
                    "data": {
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "has_profile": has_profile,
                        },
                        "access": access_token,
                        "refresh": refresh_token,
                    },
                    "meta": {
                        "profile_required": not has_profile,
                        "next_action": "create_profile" if not has_profile else None,
                    },
                }
                response.data = response_data

            return response

        # Format validation errors
        error_response = {
            "success": False,
            "message": "Login failed",
            "errors": self._format_validation_errors(serializer.errors),
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
            refresh_token = request.data.get("refresh")

            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            else:
                # If no refresh token provided, blacklist all user tokens
                if request.user.is_authenticated:
                    tokens = OutstandingToken.objects.filter(user=request.user)
                    for token in tokens:
                        BlacklistedToken.objects.get_or_create(token=token)

            response_data = {"success": True, "message": "Logout successful", "data": None}
            return Response(response_data, status=status.HTTP_200_OK)

        except TokenError as exc:
            error_response = {"success": False, "message": "Logout failed", "errors": {"detail": str(exc)}}
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)


class CurrentSessionAPIView(CustomLogoutView):
    @extend_schema(
        request=None,
        responses={200: OpenApiResponse(description="Current session ended.")},
    )
    def delete(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)


class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profiles
    """

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [ProfileIsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        """Return appropriate serializer class based on action"""
        if self.action in ["update", "partial_update"]:
            return ProfileUpdateSerializer
        return ProfileSerializer

    def create(self, request, *args, **kwargs):
        """Create a new profile for the authenticated user"""
        try:
            # Check if user already has a profile
            if profile_exists_for_user(user=request.user):
                response_data = {
                    "success": False,
                    "message": "Profile creation failed",
                    "errors": {"detail": "User already has a profile"},
                }
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                create_profile(user=request.user, serializer=serializer)
                response_data = {
                    "success": True,
                    "message": "Profile created successfully",
                    "data": {"profile": serializer.data},
                }
                return Response(response_data, status=status.HTTP_201_CREATED)

            error_response = {
                "success": False,
                "message": "Profile creation failed",
                "errors": self._format_validation_errors(serializer.errors),
            }
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Profile creation error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Profile creation failed 1",
                "errors": {"detail": "An unexpected error occurred"},
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific profile"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)

            response_data = {
                "success": True,
                "message": "Profile retrieved successfully",
                "data": {"profile": serializer.data},
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Profile.DoesNotExist:
            error_response = {
                "success": False,
                "message": "Profile not found",
                "errors": {"detail": "The requested profile does not exist"},
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        """Update profile (full update)"""
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()

            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                update_profile(profile=instance, serializer=serializer)
                response_data = {
                    "success": True,
                    "message": "Profile updated successfully",
                    "data": {"profile": serializer.data},
                }
                return Response(response_data, status=status.HTTP_200_OK)

            error_response = {
                "success": False,
                "message": "Profile update failed",
                "errors": self._format_validation_errors(serializer.errors),
            }
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

        except Profile.DoesNotExist:
            error_response = {
                "success": False,
                "message": "Profile not found",
                "errors": {"detail": "The requested profile does not exist"},
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"Profile update error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Profile update failed 2",
                "errors": {"detail": "An unexpected error occurred"},
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        """Partial update of profile"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        """List profiles with optional filtering"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)

            if page is not None:
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)

                # Wrap in standard response format
                response_data = {
                    "success": True,
                    "message": "Profiles retrieved successfully",
                    "data": {
                        "profiles": paginated_response.data["results"],
                        "pagination": {
                            "count": paginated_response.data["count"],
                            "next": paginated_response.data["next"],
                            "previous": paginated_response.data["previous"],
                        },
                    },
                }
                return Response(response_data, status=status.HTTP_200_OK)

            serializer = self.get_serializer(queryset, many=True)
            response_data = {
                "success": True,
                "message": "Profiles retrieved successfully",
                "data": {"profiles": serializer.data},
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Profile list error: {str(e)}")
            error_response = {
                "success": False,
                "message": "Failed to retrieve profiles",
                "errors": {"detail": "An unexpected error occurred"},
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        return profile_list(
            username=self.request.query_params.get("username"),
            profile_type=self.request.query_params.get("profile_type"),
        )

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """Endpoint to get or update the current user's profile"""
        try:
            profile = profile_for_user(user=request.user)
            if profile is None:
                error_response = {
                    "success": False,
                    "message": "Profile not found",
                    "errors": {"detail": "You need to create a profile first"},
                    "meta": {"action_required": "create_profile"},
                }
                return Response(error_response, status=status.HTTP_404_NOT_FOUND)

            if request.method == "GET":
                serializer = self.get_serializer(profile)
                response_data = {
                    "success": True,
                    "message": "Profile retrieved successfully",
                    "data": {"profile": serializer.data},
                }
                return Response(response_data, status=status.HTTP_200_OK)

            elif request.method == "PATCH":
                serializer = self.get_serializer(profile, data=request.data, partial=True)
                if serializer.is_valid():
                    update_profile(profile=profile, serializer=serializer)
                    response_data = {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": {"profile": serializer.data},
                    }
                    return Response(response_data, status=status.HTTP_200_OK)

                error_response = {
                    "success": False,
                    "message": "Profile update failed",
                    "errors": self._format_validation_errors(serializer.errors),
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Profile me endpoint error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "An unexpected error occurred",
                "errors": {"detail": str(e)},
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    def upload_picture(self, request):
        """Upload profile picture to Cloudinary"""
        try:
            # Check if user has a profile
            profile = profile_for_user(user=request.user)
            if profile is None:
                error_response = {
                    "success": False,
                    "message": "Profile not found",
                    "errors": {"detail": "You need to create a profile first"},
                    "meta": {"action_required": "create_profile"},
                }
                return Response(error_response, status=status.HTTP_404_NOT_FOUND)

            # Check if image is provided
            if "profile_pic" not in request.FILES:
                error_response = {
                    "success": False,
                    "message": "Upload failed",
                    "errors": {"profile_pic": "No image file provided"},
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES["profile_pic"]

            validation_error = validate_profile_image(image_file=image_file)
            if validation_error:
                error_response = {
                    "success": False,
                    "message": "Upload failed",
                    "errors": {"profile_pic": validation_error},
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

            upload_result = upload_profile_picture(profile=profile, image_file=image_file)
            response_data = {
                "success": True,
                "message": "Profile picture uploaded successfully",
                "data": {
                    "profile_pic_url": upload_result["secure_url"],
                    "cloudinary_public_id": upload_result["public_id"],
                },
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Profile picture upload error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Upload failed",
                "errors": {"detail": f"Upload failed: {str(e)}"},
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _format_validation_errors(self, errors):
        """Format validation errors for consistent response"""
        formatted_errors = {}
        for field, error_list in errors.items():
            if isinstance(error_list, list):
                formatted_errors[field] = error_list[0] if error_list else None
            elif isinstance(error_list, dict):
                # Handle nested errors (e.g., from related fields)
                formatted_errors[field] = error_list
            else:
                formatted_errors[field] = str(error_list)
        return formatted_errors


class CustomPasswordResetView(PasswordResetView):
    """Custom password reset view with standardized response"""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            response_data = {
                "success": True,
                "message": "Password reset email sent successfully",
                "data": {"detail": "If an account with this email exists, you will receive a password reset link."},
            }
            return Response(response_data, status=status.HTTP_200_OK)

        return response


class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    """Custom password reset confirmation view"""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            response_data = {
                "success": True,
                "message": "Password reset successful",
                "data": {
                    "detail": "Your password has been reset successfully. You can now login with your new password."
                },
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Handle validation errors
            error_response = {
                "success": False,
                "message": "Password reset failed",
                "errors": response.data
                if hasattr(response, "data")
                else {"detail": "Invalid token or passwords don't match"},
            }
            return Response(error_response, status=response.status_code)


class UserDataDetailView(generics.RetrieveAPIView):
    """
    Retrieve all data associated with a specific user.
    Includes profile, reading lists, ratings, reviews, and social connections.
    """

    serializer_class = UserDataSerializer
    permission_classes = [DRFIsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return user_data_queryset()

    def get_object(self):
        return get_user_data(user_id=self.kwargs.get("id"))

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)

            return Response(
                {"success": True, "message": "User data retrieved successfully", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"success": False, "message": f"Error retrieving user data: {str(e)}", "data": None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
