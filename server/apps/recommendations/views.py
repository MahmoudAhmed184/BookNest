from rest_framework import generics, status
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.recommendations import selectors, services
from apps.recommendations.models import (
    CatalogRecommendation,
    RecommendationFeedback,
    RecommendationModel,
    RecommendationRun,
)
from apps.recommendations.serializers import (
    CatalogRecommendationSerializer,
    RecommendationFeedbackSerializer,
    RecommendationModelSerializer,
    RecommendationRunSerializer,
    UserRecommendationSerializer,
)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class UserRecommendationListAPIView(generics.ListAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.user_recommendations_for_user(user=self.request.user)


class UserRecommendationResourceAPIView(generics.RetrieveAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.user_recommendations_for_user(user=self.request.user)


class RecommendationDismissAPIView(generics.GenericAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        recommendation = generics.get_object_or_404(selectors.user_recommendations_for_user(user=request.user), pk=pk)
        services.dismiss_recommendation(recommendation=recommendation)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecommendationClickAPIView(generics.GenericAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        recommendation = generics.get_object_or_404(selectors.user_recommendations_for_user(user=request.user), pk=pk)
        services.mark_recommendation_clicked(recommendation=recommendation)
        return Response(UserRecommendationSerializer(recommendation).data, status=status.HTTP_200_OK)


class CatalogRecommendationListAPIView(generics.ListCreateAPIView):
    serializer_class = CatalogRecommendationSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return selectors.catalog_recommendations(source=self.request.query_params.get("source"))


class CatalogRecommendationResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CatalogRecommendation.objects.select_related("book")
    serializer_class = CatalogRecommendationSerializer
    permission_classes = [IsAdminOrReadOnly]


class RecommendationFeedbackCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = RecommendationFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecommendationFeedback.objects.select_related("book", "recommendation").filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecommendationFeedbackResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecommendationFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecommendationFeedback.objects.select_related("book", "recommendation").filter(user=self.request.user)


class RecommendationModelCollectionAPIView(generics.ListCreateAPIView):
    queryset = RecommendationModel.objects.all()
    serializer_class = RecommendationModelSerializer
    permission_classes = [IsAdminUser]


class RecommendationModelResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RecommendationModel.objects.all()
    serializer_class = RecommendationModelSerializer
    permission_classes = [IsAdminUser]


class RecommendationRunListAPIView(generics.ListCreateAPIView):
    queryset = RecommendationRun.objects.select_related("model", "requested_by", "task_log")
    serializer_class = RecommendationRunSerializer
    permission_classes = [IsAdminUser]


class RecommendationRunResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RecommendationRun.objects.select_related("model", "requested_by", "task_log")
    serializer_class = RecommendationRunSerializer
    permission_classes = [IsAdminUser]
