from __future__ import annotations

from rest_framework import generics
from rest_framework.permissions import IsAdminUser

from apps.operations.models import TaskLog
from apps.operations.serializers import TaskLogSerializer


class TaskLogCollectionAPIView(generics.ListCreateAPIView):
    queryset = TaskLog.objects.all()
    serializer_class = TaskLogSerializer
    permission_classes = [IsAdminUser]


class TaskLogResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TaskLog.objects.all()
    serializer_class = TaskLogSerializer
    permission_classes = [IsAdminUser]
