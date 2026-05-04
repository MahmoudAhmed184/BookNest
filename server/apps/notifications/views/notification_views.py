from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.notifications.models import Notification, NotificationType
from apps.notifications.serializers import NotificationSerializer, NotificationCreateSerializer
from apps.notifications.selectors import notifications_for_user
from apps.notifications.services import NotificationService


class IsRecipientOrAdmin(IsAuthenticated):
    """
    Custom permission to only allow recipients to view their own notifications.
    """
    def has_object_permission(self, request, view, obj):
        # Admin can see all notifications
        if request.user.is_staff:
            return True
        # Recipients can only see their own notifications
        return obj.recipient == request.user


class NotificationListAPIView(generics.ListAPIView):
    """
    API endpoint for listing notifications for the current user.
    Can be filtered by read/unread status and notification type.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return notifications for the current user.
        Can be filtered by read/unread status.
        """
        read = self.request.query_params.get('read')
        notification_type = self.request.query_params.get('type')
        return notifications_for_user(
            self.request.user,
            read=read.lower() == 'true' if read is not None else None,
            notification_type=notification_type,
        )


class NotificationDetailAPIView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific notification.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsRecipientOrAdmin]
    lookup_field = 'id'
    
    def get_queryset(self):
        return notifications_for_user(self.request.user)


class NotificationCreateAPIView(generics.CreateAPIView):
    """
    API endpoint for creating a new notification.
    """
    serializer_class = NotificationCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        notification = serializer.save()
        return notification


class NotificationUpdateAPIView(generics.UpdateAPIView):
    """
    API endpoint for updating a notification.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsRecipientOrAdmin]
    lookup_field = 'id'
    
    def get_queryset(self):
        return notifications_for_user(self.request.user)


class NotificationDeleteAPIView(generics.DestroyAPIView):
    """
    API endpoint for deleting a notification.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsRecipientOrAdmin]
    lookup_field = 'id'
    
    def get_queryset(self):
        return notifications_for_user(self.request.user)


class NotificationMarkAsReadAPIView(APIView):
    """
    API endpoint for marking a notification as read.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id=None):
        NotificationService.mark_as_read(notification_id=id, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationMarkAsUnreadAPIView(APIView):
    """
    API endpoint for marking a notification as unread.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id=None):
        NotificationService.mark_as_unread(notification_id=id, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationMarkAllAsReadAPIView(APIView):
    """
    API endpoint for marking all notifications as read.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        NotificationService.mark_all_as_read(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationUnreadCountAPIView(APIView):
    """
    API endpoint for getting the count of unread notifications.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({'count': count})
