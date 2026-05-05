from __future__ import annotations

from typing import Any

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.follows.selectors import (
    follow_relationships_for_user,
    followers_for_profile,
    following_for_profile,
    follows_created_by_user,
    get_profile,
)
from apps.follows.serializers import (
    FollowCreateSerializer,
    FollowerListSerializer,
    FollowingListSerializer,
    FollowSerializer,
)
from apps.follows.services import create_follow


class FollowCollectionAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return FollowCreateSerializer
        return FollowSerializer

    def get_queryset(self) -> Any:
        return follow_relationships_for_user(user=self.request.user)

    def perform_create(self, serializer: Any) -> None:
        follower_profile = self.request.user.profile
        followed_id = serializer.validated_data["followed"].id
        followed_profile = get_profile(profile_id=followed_id)
        serializer.instance = create_follow(
            follower=follower_profile,
            followed=followed_profile,
        )


class FollowResourceAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self) -> Any:
        return follows_created_by_user(user=self.request.user)


class FollowerListAPIView(generics.ListAPIView):
    """
    API endpoint for listing users who follow the current user.
    """

    serializer_class = FollowerListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Any:
        return followers_for_profile(profile=self.request.user.profile)


class FollowingListAPIView(generics.ListAPIView):
    """
    API endpoint for listing users that the current user follows.
    """

    serializer_class = FollowingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Any:
        return following_for_profile(profile=self.request.user.profile)


class UserFollowersAPIView(generics.ListAPIView):
    """
    API endpoint for listing followers of a specific user.
    """

    serializer_class = FollowerListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Any:
        user_id = self.kwargs.get("user_id")
        profile = get_profile(profile_id=user_id)
        return followers_for_profile(profile=profile)


class UserFollowingAPIView(generics.ListAPIView):
    """
    API endpoint for listing users that a specific user follows.
    """

    serializer_class = FollowingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Any:
        user_id = self.kwargs.get("user_id")
        profile = get_profile(profile_id=user_id)
        return following_for_profile(profile=profile)
