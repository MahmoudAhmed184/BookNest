from django.urls import path

from apps.recommendations import views

urlpatterns = [
    path("recommendations/", views.UserRecommendationListAPIView.as_view(), name="recommendation-list"),
    path("recommendations/<int:pk>/", views.UserRecommendationResourceAPIView.as_view(), name="recommendation"),
    path(
        "recommendations/<int:pk>/dismiss/",
        views.RecommendationDismissAPIView.as_view(),
        name="recommendation-dismiss",
    ),
    path(
        "recommendations/<int:pk>/click/",
        views.RecommendationClickAPIView.as_view(),
        name="recommendation-click",
    ),
    path(
        "catalog-recommendations/",
        views.CatalogRecommendationListAPIView.as_view(),
        name="catalog-recommendation-list",
    ),
    path(
        "catalog-recommendations/<int:pk>/",
        views.CatalogRecommendationResourceAPIView.as_view(),
        name="catalog-recommendation",
    ),
    path(
        "recommendation-feedback/",
        views.RecommendationFeedbackCollectionAPIView.as_view(),
        name="recommendation-feedback",
    ),
    path(
        "recommendation-feedback/<int:pk>/",
        views.RecommendationFeedbackResourceAPIView.as_view(),
        name="recommendation-feedback-resource",
    ),
    path(
        "recommendation-models/",
        views.RecommendationModelCollectionAPIView.as_view(),
        name="recommendation-model-list",
    ),
    path(
        "recommendation-models/<int:pk>/",
        views.RecommendationModelResourceAPIView.as_view(),
        name="recommendation-model",
    ),
    path("recommendation-runs/", views.RecommendationRunListAPIView.as_view(), name="recommendation-run-list"),
    path("recommendation-runs/<int:pk>/", views.RecommendationRunResourceAPIView.as_view(), name="recommendation-run"),
]
