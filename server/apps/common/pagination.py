from __future__ import annotations

from django.conf import settings
from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = settings.DRF_PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = settings.DRF_MAX_PAGE_SIZE


class StandardCursorPagination(CursorPagination):
    page_size = settings.DRF_PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = settings.DRF_MAX_PAGE_SIZE
    ordering = ("-created_at", "-id")


class FeedCursorPagination(StandardCursorPagination):
    ordering = ("-occurred_at", "-id")


class RecommendationCursorPagination(StandardCursorPagination):
    ordering = ("rank", "id")
