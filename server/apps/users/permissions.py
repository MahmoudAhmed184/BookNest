# users/permissions.py
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the profile
        return obj.user == request.user


class HasProfilePermission(permissions.BasePermission):
    """
    Custom permission to ensure user has created a profile before accessing other resources.
    """
    message = {
        "error": "Profile required",
        "detail": "You must create a profile before accessing this resource.",
        "action_required": "create_profile"
    }

    def has_permission(self, request, view):
        # Allow authenticated users to access profile creation endpoints
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Skip profile check for profile creation/retrieval endpoints
        profile_endpoints = ['profile-list', 'profile-detail', 'my-profile', 'profile-picture-upload']
        if hasattr(view, 'get_view_name') and any(endpoint in view.get_view_name().lower() for endpoint in profile_endpoints):
            return True
            
        # Check if user has a profile for other endpoints
        if hasattr(request.user, 'profile'):
            return True
            
        return False


class IsAuthenticated(permissions.BasePermission):
    """
    Custom IsAuthenticated permission with proper error formatting.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated)