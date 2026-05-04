from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.serializers import NotificationCreateSerializer, NotificationSerializer
from apps.notifications.selectors import notifications_for_user
from apps.notifications.services import NotificationService


class IsRecipientOrAdmin(IsAuthenticated):
    """
    Custom permission to only allow recipients to view their own notifications.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        return obj.recipient == request.user


class NotificationCollectionAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return NotificationCreateSerializer
        return NotificationSerializer

    def get_queryset(self):
        read = self.request.query_params.get("read")
        notification_type = self.request.query_params.get("type")
        return notifications_for_user(
            self.request.user,
            read=read.lower() == "true" if read is not None else None,
            notification_type=notification_type,
        )


class NotificationResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsRecipientOrAdmin]
    lookup_field = "id"

    def get_queryset(self):
        return notifications_for_user(self.request.user)


class NotificationUnreadCountAPIView(APIView):
    """
    API endpoint for getting the count of unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({'count': count})
