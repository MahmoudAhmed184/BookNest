from __future__ import annotations

from typing import TYPE_CHECKING

from apps.search.models import SearchIndexStatus

if TYPE_CHECKING:
    from django.db.models import QuerySet


def index_statuses() -> QuerySet[SearchIndexStatus]:
    return SearchIndexStatus.objects.select_related("current_task", "last_indexed_book")
