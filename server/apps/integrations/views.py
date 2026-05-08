import logging

from rest_framework import generics
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from apps.integrations import selectors
from apps.integrations.models import (
    BookExternalIdentifier,
    ExternalBookRecord,
    ExternalCatalogSource,
    ExternalSyncRun,
    ExternalSyncState,
)
from apps.integrations.serializers import (
    BookExternalIdentifierSerializer,
    ExternalBookRecordSerializer,
    ExternalCatalogSourceSerializer,
    ExternalEnrichmentRequestSerializer,
    ExternalSyncRunSerializer,
    ExternalSyncStateSerializer,
)
from apps.integrations.tasks import enqueue_external_enrichment_request

logger = logging.getLogger(__name__)


class ExternalCatalogSourceListAPIView(generics.ListCreateAPIView):
    queryset = ExternalCatalogSource.objects.all()
    serializer_class = ExternalCatalogSourceSerializer
    permission_classes = [IsAdminUser]


class ExternalCatalogSourceResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExternalCatalogSource.objects.all()
    serializer_class = ExternalCatalogSourceSerializer
    permission_classes = [IsAdminUser]


class BookExternalIdentifierListAPIView(generics.ListCreateAPIView):
    queryset = BookExternalIdentifier.objects.select_related("book", "source")
    serializer_class = BookExternalIdentifierSerializer
    permission_classes = [IsAdminUser]


class BookExternalIdentifierResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookExternalIdentifier.objects.select_related("book", "source")
    serializer_class = BookExternalIdentifierSerializer
    permission_classes = [IsAdminUser]


class ExternalBookRecordListAPIView(generics.ListCreateAPIView):
    queryset = ExternalBookRecord.objects.select_related("source", "matched_book")
    serializer_class = ExternalBookRecordSerializer
    permission_classes = [IsAdminUser]


class ExternalBookRecordResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExternalBookRecord.objects.select_related("source", "matched_book")
    serializer_class = ExternalBookRecordSerializer
    permission_classes = [IsAdminUser]


class ExternalEnrichmentRequestCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ExternalEnrichmentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return selectors.enrichment_requests()
        return selectors.enrichment_requests().filter(requested_by=self.request.user)

    def perform_create(self, serializer):
        request = serializer.save(requested_by=self.request.user)
        try:
            enqueue_external_enrichment_request(request=request)
        except Exception as exc:
            logger.warning("Could not enqueue external enrichment request %s: %s", request.pk, exc)


class ExternalEnrichmentRequestResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExternalEnrichmentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = selectors.enrichment_requests()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(requested_by=self.request.user)


class ExternalSyncRunListAPIView(generics.ListCreateAPIView):
    serializer_class = ExternalSyncRunSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return selectors.sync_runs()


class ExternalSyncRunResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExternalSyncRun.objects.select_related("source", "task_log")
    serializer_class = ExternalSyncRunSerializer
    permission_classes = [IsAdminUser]


class ExternalSyncStateListAPIView(generics.ListCreateAPIView):
    serializer_class = ExternalSyncStateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return selectors.sync_states()


class ExternalSyncStateResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExternalSyncState.objects.select_related("source")
    serializer_class = ExternalSyncStateSerializer
    permission_classes = [IsAdminUser]
