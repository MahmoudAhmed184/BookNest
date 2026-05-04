from django.urls import path

from apps.notifications.views.notification_type import (
    NotificationTypeDetailAPIView,
    NotificationTypeListAPIView,
)
from apps.notifications.views.notification import (
    NotificationCollectionAPIView,
    NotificationResourceAPIView,
    NotificationUnreadCountAPIView,
)


urlpatterns = [
    path("notifications/", NotificationCollectionAPIView.as_view(), name="notification-collection"),
    path("notifications/<int:id>/", NotificationResourceAPIView.as_view(), name="notification-resource"),
    path("notification-types/", NotificationTypeListAPIView.as_view(), name="notification-type-list"),
    path("notification-types/<int:id>/", NotificationTypeDetailAPIView.as_view(), name="notification-type-detail"),
    path("notification-counts/unread/", NotificationUnreadCountAPIView.as_view(), name="unread-notification-count"),
]
