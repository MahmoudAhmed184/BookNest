from django.urls import path

from apps.operations import views

urlpatterns = [
    path("task-logs/", views.TaskLogCollectionAPIView.as_view(), name="task-log-collection"),
    path("task-logs/<int:pk>/", views.TaskLogResourceAPIView.as_view(), name="task-log-resource"),
]
