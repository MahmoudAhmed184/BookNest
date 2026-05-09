from django.urls import include, path

from apps.users import views

urlpatterns = [
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/registration/", include("dj_rest_auth.registration.urls")),
    path("users/", views.UserCollectionAPIView.as_view(), name="user-collection"),
    path("users/me/", views.CurrentUserAPIView.as_view(), name="current-user"),
    path("users/<int:pk>/", views.UserResourceAPIView.as_view(), name="user-resource"),
    path("users/<int:user_id>/profile/", views.UserProfileAPIView.as_view(), name="user-profile"),
    path(
        "users/<int:user_id>/profile-overview/",
        views.UserProfileOverviewAPIView.as_view(),
        name="user-profile-overview",
    ),
    path("users/<int:user_id>/reviews/", views.UserReviewListAPIView.as_view(), name="user-review-list"),
    path("users/<int:user_id>/ratings/", views.UserRatingListAPIView.as_view(), name="user-rating-list"),
    path(
        "users/<int:user_id>/reading-collections/",
        views.UserReadingCollectionListAPIView.as_view(),
        name="user-reading-collection-list",
    ),
    path("profiles/", views.ProfileCollectionAPIView.as_view(), name="profile-collection"),
    path("profiles/me/", views.CurrentProfileAPIView.as_view(), name="current-profile"),
    path("profiles/me/picture/", views.CurrentProfilePictureAPIView.as_view(), name="current-profile-picture"),
    path(
        "profiles/by-handle/<slug:handle>/overview/",
        views.ProfileOverviewByHandleAPIView.as_view(),
        name="profile-overview-by-handle",
    ),
    path(
        "profiles/me/interests/",
        views.ProfileInterestCollectionAPIView.as_view(),
        name="profile-interest-collection",
    ),
    path(
        "profiles/me/interests/<int:pk>/",
        views.ProfileInterestResourceAPIView.as_view(),
        name="profile-interest-resource",
    ),
    path(
        "profiles/me/social-links/",
        views.UserSocialLinkCollectionAPIView.as_view(),
        name="profile-social-link-collection",
    ),
    path(
        "profiles/me/social-links/<int:pk>/",
        views.UserSocialLinkResourceAPIView.as_view(),
        name="profile-social-link-resource",
    ),
    path("profiles/<int:pk>/", views.ProfileResourceAPIView.as_view(), name="profile-resource"),
    path("preferences/me/", views.CurrentPreferenceAPIView.as_view(), name="current-preferences"),
    path("user-preferences/", views.UserPreferenceCollectionAPIView.as_view(), name="user-preference-collection"),
    path("user-preferences/<int:pk>/", views.UserPreferenceResourceAPIView.as_view(), name="user-preference-resource"),
]
