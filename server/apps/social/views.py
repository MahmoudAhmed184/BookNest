from typing import TYPE_CHECKING

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from apps.common.pagination import FeedCursorPagination, StandardResultsSetPagination
from apps.social import selectors, services
from apps.social.serializers import FeedEventSerializer, FollowRelationshipSerializer
from apps.users import selectors as user_selectors

if TYPE_CHECKING:
    from apps.social.models import FollowRelationship


class FollowRelationshipCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = FollowRelationshipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = selectors.following_for_user(user=self.request.user)
        following = self.request.query_params.get("following")
        if following:
            try:
                following_id = int(following)
            except ValueError:
                return queryset.none()
            queryset = queryset.filter(following_id=following_id)
        return queryset

    def perform_create(self, serializer):
        relationship = services.follow_user(
            follower=self.request.user,
            following=serializer.validated_data["following"],
        )
        serializer.instance = relationship


class FollowRelationshipResourceAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = FollowRelationshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.following_for_user(user=self.request.user)

    def perform_destroy(self, instance: FollowRelationship) -> None:
        services.unfollow_user(relationship=instance)


class FollowerListAPIView(generics.ListAPIView):
    serializer_class = FollowRelationshipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return selectors.followers_for_user(user=self.request.user)


class UserFollowerListAPIView(generics.ListAPIView):
    serializer_class = FollowRelationshipSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        target_user = user_selectors.get_user(pk=self.kwargs["user_id"])
        return selectors.followers_for_target_user(target_user=target_user, viewer=self.request.user)


class UserFollowingListAPIView(generics.ListAPIView):
    serializer_class = FollowRelationshipSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        target_user = user_selectors.get_user(pk=self.kwargs["user_id"])
        return selectors.following_for_target_user(target_user=target_user, viewer=self.request.user)


class FeedEventListAPIView(generics.ListAPIView):
    serializer_class = FeedEventSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = FeedCursorPagination

    def get_queryset(self):
        return selectors.feed_for_user(user=self.request.user)


class FeedEventResourceAPIView(generics.RetrieveAPIView):
    serializer_class = FeedEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.feed_for_user(user=self.request.user)
