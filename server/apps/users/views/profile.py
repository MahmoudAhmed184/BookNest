# users/views/profile.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.models.profile import Profile
from apps.users.serializers.profile import ProfileSerializer, ProfileUpdateSerializer
from apps.users.permissions import IsOwnerOrReadOnly, IsAuthenticated
from apps.users.selectors import profile_exists_for_user, profile_for_user, profile_list
from apps.users.services import (
    create_profile,
    update_profile,
    upload_profile_picture,
    validate_profile_image,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import logging

logger = logging.getLogger(__name__)


class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profiles
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action"""
        if self.action in ['update', 'partial_update']:
            return ProfileUpdateSerializer
        return ProfileSerializer

    def create(self, request, *args, **kwargs):
        """Create a new profile for the authenticated user"""
        try:
            # Check if user already has a profile
            if profile_exists_for_user(request.user):
                response_data = {
                    "success": False,
                    "message": "Profile creation failed",
                    "errors": {"detail": "User already has a profile"}
                }
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                create_profile(user=request.user, serializer=serializer)
                response_data = {
                    "success": True,
                    "message": "Profile created successfully",
                    "data": {
                        "profile": serializer.data
                    }
                }
                return Response(response_data, status=status.HTTP_201_CREATED)

            error_response = {
                "success": False,
                "message": "Profile creation failed",
                "errors": self._format_validation_errors(serializer.errors)
            }
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Profile creation error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Profile creation failed 1",
                "errors": {"detail": "An unexpected error occurred"}
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
                "data": {
                    "profile": serializer.data
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Profile.DoesNotExist:
            error_response = {
                "success": False,
                "message": "Profile not found",
                "errors": {"detail": "The requested profile does not exist"}
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        """Update profile (full update)"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                update_profile(profile=instance, serializer=serializer)
                response_data = {
                    "success": True,
                    "message": "Profile updated successfully",
                    "data": {
                        "profile": serializer.data
                    }
                }
                return Response(response_data, status=status.HTTP_200_OK)

            error_response = {
                "success": False,
                "message": "Profile update failed",
                "errors": self._format_validation_errors(serializer.errors)
            }
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
                
        except Profile.DoesNotExist:
            error_response = {
                "success": False,
                "message": "Profile not found",
                "errors": {"detail": "The requested profile does not exist"}
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Profile update error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Profile update failed 2",
                "errors": {"detail": "An unexpected error occurred"}
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        """Partial update of profile"""
        kwargs['partial'] = True
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
                        "profiles": paginated_response.data['results'],
                        "pagination": {
                            "count": paginated_response.data['count'],
                            "next": paginated_response.data['next'],
                            "previous": paginated_response.data['previous']
                        }
                    }
                }
                return Response(response_data, status=status.HTTP_200_OK)
            
            serializer = self.get_serializer(queryset, many=True)
            response_data = {
                "success": True,
                "message": "Profiles retrieved successfully",
                "data": {
                    "profiles": serializer.data
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile list error: {str(e)}")
            error_response = {
                "success": False,
                "message": "Failed to retrieve profiles",
                "errors": {"detail": "An unexpected error occurred"}
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        return profile_list(
            username=self.request.query_params.get('username'),
            profile_type=self.request.query_params.get('profile_type'),
        )

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Endpoint to get or update the current user's profile"""
        try:
            profile = profile_for_user(request.user)
            if profile is None:
                error_response = {
                    "success": False,
                    "message": "Profile not found",
                    "errors": {"detail": "You need to create a profile first"},
                    "meta": {
                        "action_required": "create_profile"
                    }
                }
                return Response(error_response, status=status.HTTP_404_NOT_FOUND)
            
            if request.method == 'GET':
                serializer = self.get_serializer(profile)
                response_data = {
                    "success": True,
                    "message": "Profile retrieved successfully",
                    "data": {
                        "profile": serializer.data
                    }
                }
                return Response(response_data, status=status.HTTP_200_OK)
            
            elif request.method == 'PATCH':
                serializer = self.get_serializer(profile, data=request.data, partial=True)
                if serializer.is_valid():
                    update_profile(profile=profile, serializer=serializer)
                    response_data = {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": {
                            "profile": serializer.data
                        }
                    }
                    return Response(response_data, status=status.HTTP_200_OK)

                error_response = {
                    "success": False,
                    "message": "Profile update failed",
                    "errors": self._format_validation_errors(serializer.errors)
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            logger.error(f"Profile me endpoint error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "An unexpected error occurred",
                "errors": {"detail": str(e)}
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def upload_picture(self, request):
        """Upload profile picture to Cloudinary"""
        try:
            # Check if user has a profile
            profile = profile_for_user(request.user)
            if profile is None:
                error_response = {
                    "success": False,
                    "message": "Profile not found",
                    "errors": {"detail": "You need to create a profile first"},
                    "meta": {
                        "action_required": "create_profile"
                    }
                }
                return Response(error_response, status=status.HTTP_404_NOT_FOUND)
            
            # Check if image is provided
            if 'profile_pic' not in request.FILES:
                error_response = {
                    "success": False,
                    "message": "Upload failed",
                    "errors": {"profile_pic": "No image file provided"}
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
            
            image_file = request.FILES['profile_pic']
            
            validation_error = validate_profile_image(image_file)
            if validation_error:
                error_response = {
                    "success": False,
                    "message": "Upload failed",
                    "errors": {"profile_pic": validation_error}
                }
                return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

            upload_result = upload_profile_picture(profile=profile, image_file=image_file)
            response_data = {
                "success": True,
                "message": "Profile picture uploaded successfully",
                "data": {
                    "profile_pic_url": upload_result['secure_url'],
                    "cloudinary_public_id": upload_result['public_id']
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Profile picture upload error for user {request.user.id}: {str(e)}")
            error_response = {
                "success": False,
                "message": "Upload failed",
                "errors": {"detail": f"Upload failed: {str(e)}"}
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
