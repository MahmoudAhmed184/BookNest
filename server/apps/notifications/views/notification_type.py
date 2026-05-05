from __future__ import annotations

from typing import Any

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.notifications.selectors import notification_type_queryset
from apps.notifications.serializers import NotificationTypeSerializer


class NotificationTypeListAPIView(generics.ListAPIView):
    """
    API endpoint for listing all notification types.
    """

    serializer_class = NotificationTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Any:
        return notification_type_queryset()


class NotificationTypeDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific notification type.
    """

    serializer_class = NotificationTypeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self) -> Any:
        return notification_type_queryset()
