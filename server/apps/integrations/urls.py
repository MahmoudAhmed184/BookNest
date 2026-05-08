from django.urls import path

from apps.integrations import views

urlpatterns = [
    path("external-sources/", views.ExternalCatalogSourceListAPIView.as_view(), name="external-source-list"),
    path("external-sources/<int:pk>/", views.ExternalCatalogSourceResourceAPIView.as_view(), name="external-source"),
    path("external-identifiers/", views.BookExternalIdentifierListAPIView.as_view(), name="external-identifier-list"),
    path(
        "external-identifiers/<int:pk>/",
        views.BookExternalIdentifierResourceAPIView.as_view(),
        name="external-identifier",
    ),
    path("external-records/", views.ExternalBookRecordListAPIView.as_view(), name="external-record-list"),
    path("external-records/<int:pk>/", views.ExternalBookRecordResourceAPIView.as_view(), name="external-record"),
    path(
        "external-enrichment-requests/",
        views.ExternalEnrichmentRequestCollectionAPIView.as_view(),
        name="external-enrichment-request-list",
    ),
    path(
        "external-enrichment-requests/<int:pk>/",
        views.ExternalEnrichmentRequestResourceAPIView.as_view(),
        name="external-enrichment-request",
    ),
    path("external-sync-runs/", views.ExternalSyncRunListAPIView.as_view(), name="external-sync-run-list"),
    path("external-sync-runs/<int:pk>/", views.ExternalSyncRunResourceAPIView.as_view(), name="external-sync-run"),
    path("external-sync-states/", views.ExternalSyncStateListAPIView.as_view(), name="external-sync-state-list"),
    path(
        "external-sync-states/<int:pk>/",
        views.ExternalSyncStateResourceAPIView.as_view(),
        name="external-sync-state",
    ),
]
