from rest_framework import generics, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.common.pagination import RecommendationCursorPagination
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
from apps.recommendations.tasks import enqueue_recommendation_run


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, _view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class UserRecommendationListAPIView(generics.ListAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = RecommendationCursorPagination

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


class RecommendationGenerateRequestSerializer(serializers.Serializer):
    n_recommendations = serializers.IntegerField(min_value=1, max_value=100, required=False, default=10)
    model_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    train_if_missing = serializers.BooleanField(required=False, default=True)
    force_train = serializers.BooleanField(required=False, default=False)
    async_generation = serializers.BooleanField(required=False, default=False)


class RecommendationGenerateAPIView(generics.GenericAPIView):
    serializer_class = UserRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = request.data.copy()
        if "async" in payload and "async_generation" not in payload:
            payload["async_generation"] = payload["async"]
        serializer = RecommendationGenerateRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        model_id = values.get("model_id")
        model = generics.get_object_or_404(RecommendationModel, pk=model_id) if model_id else None

        if values["async_generation"]:
            run = RecommendationRun.objects.create(
                model=model,
                requested_by=request.user,
                run_type=RecommendationRun.RunType.GENERATE,
                status=RecommendationRun.Status.PENDING,
                parameters={
                    "user_id": request.user.id,
                    "n_recommendations": values["n_recommendations"],
                    "model_id": model_id,
                    "train_if_missing": values["train_if_missing"],
                    "force_train": values["force_train"],
                },
            )
            enqueue_recommendation_run(run=run)
            return Response(RecommendationRunSerializer(run).data, status=status.HTTP_202_ACCEPTED)

        recommendations = services.generate_recommendations_for_user(
            user=request.user,
            n_recommendations=values["n_recommendations"],
            model_id=model_id,
            train_if_missing=values["train_if_missing"],
            force_train=values["force_train"],
        )
        return Response(UserRecommendationSerializer(recommendations, many=True).data, status=status.HTTP_200_OK)


class CatalogRecommendationListAPIView(generics.ListCreateAPIView):
    serializer_class = CatalogRecommendationSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = RecommendationCursorPagination

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

    def perform_create(self, serializer):
        requested_status = serializer.validated_data.get("status", RecommendationRun.Status.PENDING)
        if requested_status != RecommendationRun.Status.PENDING:
            raise ValidationError({"status": "Recommendation runs must be created with pending status."})
        run = serializer.save(requested_by=self.request.user)
        enqueue_recommendation_run(run=run)


class RecommendationRunResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RecommendationRun.objects.select_related("model", "requested_by", "task_log")
    serializer_class = RecommendationRunSerializer
    permission_classes = [IsAdminUser]
