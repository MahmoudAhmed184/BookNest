from __future__ import annotations

from django.db import transaction

from apps.integrations.models import ExternalCatalogSource, ExternalSyncState

DEFAULT_EXTERNAL_SOURCES = (
    {
        "provider": ExternalCatalogSource.Provider.OPENLIBRARY,
        "display_name": "OpenLibrary",
        "base_url": "https://openlibrary.org",
        "priority": 10,
    },
    {
        "provider": ExternalCatalogSource.Provider.GOOGLE_BOOKS,
        "display_name": "Google Books",
        "base_url": "https://www.googleapis.com/books/v1",
        "priority": 20,
    },
)


@transaction.atomic
def ensure_default_sources() -> list[ExternalCatalogSource]:
    sources = []
    for defaults in DEFAULT_EXTERNAL_SOURCES:
        provider = defaults["provider"]
        source, _created = ExternalCatalogSource.objects.update_or_create(provider=provider, defaults=defaults)
        ExternalSyncState.objects.get_or_create(source=source)
        sources.append(source)
    return sources
