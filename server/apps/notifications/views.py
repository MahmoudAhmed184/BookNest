from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications import selectors, services
from apps.notifications.serializers import (
    NotificationCountSerializer,
    NotificationSerializer,
    NotificationUpdatedCountSerializer,
)


class NotificationCollectionAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        is_read = self.request.query_params.get("is_read")
        return selectors.notifications_for_user(
            user=self.request.user,
            is_read=None if is_read is None else is_read == "true",
            notification_type=self.request.query_params.get("type"),
        )


class NotificationResourceAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "notification_id"

    def get_queryset(self):
        return selectors.notifications_for_user(user=self.request.user)

    def perform_destroy(self, instance):
        services.soft_delete_notification(notification_id=instance.id, user=self.request.user)


class NotificationMarkReadAPIView(generics.GenericAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id: int):
        notification = services.mark_as_read(notification_id=notification_id, user=request.user)
        return Response(NotificationSerializer(notification).data)


class NotificationMarkUnreadAPIView(generics.GenericAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id: int):
        notification = services.mark_as_unread(notification_id=notification_id, user=request.user)
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadAPIView(generics.GenericAPIView):
    serializer_class = NotificationUpdatedCountSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = services.mark_all_as_read(user=request.user)
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class NotificationUnreadCountAPIView(generics.GenericAPIView):
    serializer_class = NotificationCountSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = NotificationCountSerializer({"unread_count": services.get_unread_count(user=request.user)})
        return Response(serializer.data)
