from django.urls import path

from apps.notifications.views.notification import (
    NotificationCollectionAPIView,
    NotificationMarkAllReadAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkUnreadAPIView,
    NotificationResourceAPIView,
    NotificationUnreadCountAPIView,
)
from apps.notifications.views.notification_type import (
    NotificationTypeDetailAPIView,
    NotificationTypeListAPIView,
)

urlpatterns = [
    path("notifications/", NotificationCollectionAPIView.as_view(), name="notification-collection"),
    path("notifications/mark-all-read/", NotificationMarkAllReadAPIView.as_view(), name="notification-mark-all-read"),
    path("notifications/<int:id>/read/", NotificationMarkReadAPIView.as_view(), name="notification-mark-read"),
    path("notifications/<int:id>/unread/", NotificationMarkUnreadAPIView.as_view(), name="notification-mark-unread"),
    path("notifications/<int:id>/", NotificationResourceAPIView.as_view(), name="notification-resource"),
    path("notification-types/", NotificationTypeListAPIView.as_view(), name="notification-type-list"),
    path("notification-types/<int:id>/", NotificationTypeDetailAPIView.as_view(), name="notification-type-detail"),
    path("notification-counts/unread/", NotificationUnreadCountAPIView.as_view(), name="unread-notification-count"),
]
