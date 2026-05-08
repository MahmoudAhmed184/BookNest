from __future__ import annotations

from typing import TYPE_CHECKING

from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus, SearchQueryLog

if TYPE_CHECKING:
    from django.db.models import QuerySet


def query_logs() -> QuerySet[SearchQueryLog]:
    return SearchQueryLog.objects.select_related("user")


def autocomplete_terms(*, prefix: str = "", term_type: str | None = None) -> QuerySet[SearchAutocompleteTerm]:
    queryset = SearchAutocompleteTerm.objects.filter(is_active=True)
    if prefix:
        queryset = queryset.filter(normalized_term__startswith=prefix.casefold())
    if term_type:
        queryset = queryset.filter(term_type=term_type)
    return queryset


def index_statuses() -> QuerySet[SearchIndexStatus]:
    return SearchIndexStatus.objects.select_related("current_task", "last_indexed_book")
