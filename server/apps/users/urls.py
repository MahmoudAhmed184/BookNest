from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.views import UserDetailsView
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from apps.users.views import (
    CurrentSessionAPIView,
    CustomLoginView,
    CustomRegisterView,
    ProfileViewSet,
    UserDataDetailView,
)

profile_collection = ProfileViewSet.as_view({"get": "list", "post": "create"})
profile_resource = ProfileViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)
profile_me = ProfileViewSet.as_view({"get": "me", "patch": "me"})
profile_picture = ProfileViewSet.as_view({"post": "upload_picture"})


urlpatterns = [
    path("auth/sessions/", CustomLoginView.as_view(), name="session-collection"),
    path("auth/sessions/current/", CurrentSessionAPIView.as_view(), name="current-session"),
    path("auth/tokens/refresh/", get_refresh_view().as_view(), name="token-refresh"),
    path("auth/tokens/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("users/", CustomRegisterView.as_view(), name="user-collection"),
    path("users/me/", UserDetailsView.as_view(), name="current-user"),
    path("users/<int:id>/data/", UserDataDetailView.as_view(), name="user-data"),
    path("profiles/", profile_collection, name="profile-collection"),
    path("profiles/me/", profile_me, name="current-profile"),
    path("profiles/me/picture/", profile_picture, name="current-profile-picture"),
    path("profiles/<int:pk>/", profile_resource, name="profile-resource"),
]
