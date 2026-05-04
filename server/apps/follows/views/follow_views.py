from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.follows.models import Follow
from apps.follows.serializers import (
    FollowSerializer, 
    FollowCreateSerializer,
    FollowerListSerializer,
    FollowingListSerializer
)
from apps.follows.selectors import (
    follow_relationships_for_user,
    followers_for_profile,
    following_for_profile,
    get_follow,
    get_profile,
)
from apps.follows.services import create_follow


class FollowListAPIView(generics.ListAPIView):
    """
    API endpoint for listing follow relationships for the current user.
    """
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return follow_relationships_for_user(self.request.user)


class FollowDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific follow relationship.
    """
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return follow_relationships_for_user(self.request.user)


class FollowCreateAPIView(generics.CreateAPIView):
    """
    API endpoint for creating a follow relationship (current user follows another user).
    """
    serializer_class = FollowCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        follower_profile = self.request.user.profile
        followed_id = serializer.validated_data['followed'].id
        followed_profile = get_profile(followed_id)
        serializer.instance = create_follow(follower=follower_profile, followed=followed_profile)


class FollowDeleteAPIView(generics.DestroyAPIView):
    """
    API endpoint for deleting a follow relationship (unfollowing a user).
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, *args, **kwargs):
        followed_id = kwargs.get('followed_id')
        if not followed_id:
            return Response(
                {'error': 'Followed user ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follower_profile = request.user.profile
        followed_profile = get_profile(followed_id)
        follow = get_follow(follower=follower_profile, followed=followed_profile)
        
        follow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowerListAPIView(generics.ListAPIView):
    """
    API endpoint for listing users who follow the current user.
    """
    serializer_class = FollowerListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return followers_for_profile(self.request.user.profile)


class FollowingListAPIView(generics.ListAPIView):
    """
    API endpoint for listing users that the current user follows.
    """
    serializer_class = FollowingListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return following_for_profile(self.request.user.profile)


class UserFollowersAPIView(generics.ListAPIView):
    """
    API endpoint for listing followers of a specific user.
    """
    serializer_class = FollowerListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        profile = get_profile(user_id)
        return followers_for_profile(profile)


class UserFollowingAPIView(generics.ListAPIView):
    """
    API endpoint for listing users that a specific user follows.
    """
    serializer_class = FollowingListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        profile = get_profile(user_id)
        return following_for_profile(profile)
