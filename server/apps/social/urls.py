from django.urls import path

from apps.social import views

urlpatterns = [
    path("follows/", views.FollowRelationshipCollectionAPIView.as_view(), name="follow-collection"),
    path("follows/<int:pk>/", views.FollowRelationshipResourceAPIView.as_view(), name="follow-resource"),
    path("followers/", views.FollowerListAPIView.as_view(), name="follower-list"),
    path("users/<int:user_id>/followers/", views.UserFollowerListAPIView.as_view(), name="user-follower-list"),
    path("users/<int:user_id>/following/", views.UserFollowingListAPIView.as_view(), name="user-following-list"),
    path("feed-events/", views.FeedEventListAPIView.as_view(), name="feed-event-list"),
    path("feed-events/<int:pk>/", views.FeedEventResourceAPIView.as_view(), name="feed-event-resource"),
]
