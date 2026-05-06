from __future__ import annotations

from typing import TYPE_CHECKING, Any

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.selectors import notifications_for_user
from apps.notifications.serializers import NotificationCreateSerializer, NotificationSerializer
from apps.notifications.services import NotificationService

if TYPE_CHECKING:
    from rest_framework.request import Request


class NotificationUnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class NotificationMarkAllReadSerializer(serializers.Serializer):
    updated = serializers.IntegerField()


class IsRecipientOrAdmin(IsAuthenticated):
    """
    Custom permission to only allow recipients to view their own notifications.
    """

    def has_object_permission(self, request: Request, view: Any, obj: Any) -> bool:
        if request.user.is_staff:
            return True

        return obj.recipient == request.user


class NotificationCollectionAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self) -> Any:
        if self.request.method == "POST":
            return NotificationCreateSerializer
        return NotificationSerializer

    def get_queryset(self) -> Any:
        read = self.request.query_params.get("read")
        notification_type = self.request.query_params.get("type")
        return notifications_for_user(
            user=self.request.user,
            read=read.lower() == "true" if read is not None else None,
            notification_type=notification_type,
        )


class NotificationResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsRecipientOrAdmin]
    lookup_field = "id"

    def get_queryset(self) -> Any:
        return notifications_for_user(user=self.request.user)


class NotificationUnreadCountAPIView(APIView):
    """
    API endpoint for getting the count of unread notifications.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: NotificationUnreadCountSerializer})
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        count = NotificationService.get_unread_count(user=request.user)
        return Response({"count": count})


class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={200: NotificationMarkAllReadSerializer},
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        updated = NotificationService.mark_all_as_read(user=request.user)
        return Response({"updated": updated})


class NotificationMarkReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: NotificationSerializer,
            404: OpenApiResponse(description="Notification not found."),
        },
    )
    def post(self, request: Request, id: int, *args: Any, **kwargs: Any) -> Response:
        notification = NotificationService.mark_as_read(
            notification_id=id,
            user=request.user,
        )
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class NotificationMarkUnreadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: NotificationSerializer,
            404: OpenApiResponse(description="Notification not found."),
        },
    )
    def post(self, request: Request, id: int, *args: Any, **kwargs: Any) -> Response:
        notification = NotificationService.mark_as_unread(
            notification_id=id,
            user=request.user,
        )
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
