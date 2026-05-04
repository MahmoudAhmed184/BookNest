from django.urls import path

from apps.recommendation.views import (
    RecommendationModelViewSet,
    UserRecommendationViewSet,
)


recommendation_collection = UserRecommendationViewSet.as_view({"get": "list"})
recommendation_refresh = UserRecommendationViewSet.as_view({"post": "generate"})
recommendation_model_collection = RecommendationModelViewSet.as_view({"get": "list"})
recommendation_model_resource = RecommendationModelViewSet.as_view({"get": "retrieve"})


urlpatterns = [
    path("recommendations/", recommendation_collection, name="recommendation-collection"),
    path("recommendation-refreshes/", recommendation_refresh, name="recommendation-refresh-collection"),
    path("recommendation-models/", recommendation_model_collection, name="recommendation-model-collection"),
    path("recommendation-models/<int:pk>/", recommendation_model_resource, name="recommendation-model-resource"),
]
