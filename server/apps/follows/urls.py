from django.urls import path

from apps.follows.views import (
    FollowCollectionAPIView,
    FollowResourceAPIView,
    FollowerListAPIView,
    FollowingListAPIView,
    UserFollowersAPIView,
    UserFollowingAPIView,
)


urlpatterns = [
    path("follows/", FollowCollectionAPIView.as_view(), name="follow-collection"),
    path("follows/<int:id>/", FollowResourceAPIView.as_view(), name="follow-resource"),
    path("profiles/me/followers/", FollowerListAPIView.as_view(), name="current-profile-followers"),
    path("profiles/me/following/", FollowingListAPIView.as_view(), name="current-profile-following"),
    path("profiles/<int:user_id>/followers/", UserFollowersAPIView.as_view(), name="profile-followers"),
    path("profiles/<int:user_id>/following/", UserFollowingAPIView.as_view(), name="profile-following"),
]
