from django.urls import path

from apps.notifications import views

urlpatterns = [
    path("notifications/", views.NotificationCollectionAPIView.as_view(), name="notification-collection"),
    path(
        "notifications/mark-all-read/",
        views.NotificationMarkAllReadAPIView.as_view(),
        name="notification-mark-all-read",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        views.NotificationMarkReadAPIView.as_view(),
        name="notification-mark-read",
    ),
    path(
        "notifications/<int:notification_id>/unread/",
        views.NotificationMarkUnreadAPIView.as_view(),
        name="notification-mark-unread",
    ),
    path(
        "notifications/<int:notification_id>/",
        views.NotificationResourceAPIView.as_view(),
        name="notification-resource",
    ),
    path(
        "notification-counts/unread/", views.NotificationUnreadCountAPIView.as_view(), name="unread-notification-count"
    ),
]
