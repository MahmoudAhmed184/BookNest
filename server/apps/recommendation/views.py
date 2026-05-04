from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import RecommendationModel
from .selectors import recommendation_models, user_recommendations
from .serializers import RecommendationModelSerializer, UserRecommendationSerializer
from .services import RecommendationService
from .tasks import generate_recommendations_for_user_task


class RecommendationModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for recommendation models
    """
    queryset = RecommendationModel.objects.none()
    serializer_class = RecommendationModelSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can access model endpoints

    def get_queryset(self):
        return recommendation_models()


class UserRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for user recommendations
    """
    serializer_class = UserRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return recommendations for the current user only
        """
        return user_recommendations(self.request.user)

    def generate(self, request):
        """
        Generate new recommendations for the current user
        """
        n_recommendations = int(request.data.get('n_recommendations', 10))
        model_id = request.data.get('model_id')
        async_generation = request.data.get('async', False)

        if async_generation:
            # Generate recommendations asynchronously
            task = generate_recommendations_for_user_task.delay(
                user_id=request.user.id,
                n_recommendations=n_recommendations,
                model_id=model_id
            )
            return Response({"message": "Recommendation generation started", "task_id": task.id})

        recommendations = RecommendationService.generate_recommendations_for_user(
            user_id=request.user.id,
            n_recommendations=n_recommendations,
            model_id=model_id
        )

        if recommendations:
            serializer = self.get_serializer(recommendations, many=True)
            return Response(serializer.data)

        return Response(
            {"message": "No recommendations generated. You may need more ratings or the model needs training."},
            status=status.HTTP_200_OK
        )
