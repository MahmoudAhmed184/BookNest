from __future__ import annotations

from typing import TYPE_CHECKING, Any

from celery.exceptions import CeleryError
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import RecommendationModel
from .selectors import rating_count_for_user, recommendation_models, user_recommendations
from .serializers import RecommendationModelSerializer, UserRecommendationSerializer
from .services import (
    DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS,
    RecommendationService,
)
from .tasks import enqueue_generate_recommendations_for_user

if TYPE_CHECKING:
    from rest_framework.request import Request


class RecommendationModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for recommendation models
    """

    queryset = RecommendationModel.objects.none()
    serializer_class = RecommendationModelSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can access model endpoints

    def get_queryset(self) -> Any:
        return recommendation_models()


class UserRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for user recommendations
    """

    serializer_class = UserRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        """
        Return recommendations for the current user only
        """
        return user_recommendations(user=self.request.user)

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.filter_queryset(self.get_queryset())
        if (
            not queryset.exists()
            and rating_count_for_user(user=request.user) >= DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS
        ):
            RecommendationService.generate_recommendations_for_user(
                user_id=request.user.id,
                n_recommendations=10,
            )
            queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def generate(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Generate new recommendations for the current user
        """
        try:
            n_recommendations = int(request.data.get("n_recommendations", 10))
        except TypeError, ValueError:
            return Response(
                {"message": "n_recommendations must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        model_id = request.data.get("model_id")
        async_generation = request.data.get("async", False)

        if async_generation:
            # Generate recommendations asynchronously
            try:
                task = enqueue_generate_recommendations_for_user(
                    user_id=request.user.id, n_recommendations=n_recommendations, model_id=model_id
                )
                return Response({"message": "Recommendation generation started", "task_id": task.id})
            except ConnectionError, CeleryError:
                recommendations = RecommendationService.generate_recommendations_for_user(
                    user_id=request.user.id, n_recommendations=n_recommendations, model_id=model_id
                )
                serializer = self.get_serializer(recommendations, many=True)
                return Response(serializer.data)

        recommendations = RecommendationService.generate_recommendations_for_user(
            user_id=request.user.id, n_recommendations=n_recommendations, model_id=model_id
        )

        if recommendations:
            serializer = self.get_serializer(recommendations, many=True)
            return Response(serializer.data)

        return Response(
            {"message": "No recommendations generated. You may need more ratings or the model needs training."},
            status=status.HTTP_200_OK,
        )
