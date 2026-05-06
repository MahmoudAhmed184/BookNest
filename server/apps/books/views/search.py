from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.cache import cache
from django.core.cache.backends.base import InvalidCacheBackendError
from django.db import DatabaseError
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from redis.exceptions import RedisError
from rest_framework import serializers, status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from apps.books.logging_config import logger
from apps.books.utils.search_service import DatabaseSearchService

if TYPE_CHECKING:
    from rest_framework.request import Request


class CacheManager:
    """Manages caching operations for the search API."""

    CACHE_VERSION = 1  # Increment this when cache structure changes
    CACHE_PREFIX = f"{settings.CACHE_KEY_PREFIX}:search"
    DEFAULT_TIMEOUT = 3600  # 1 hour
    SHORT_TIMEOUT = 300  # 5 minutes
    LONG_TIMEOUT = 86400  # 24 hours

    @classmethod
    def generate_cache_key(cls, params: dict[str, Any]) -> str:
        """Generate a unique cache key for the search parameters."""
        # Sort parameters to ensure consistent key generation
        sorted_params = json.dumps(params, sort_keys=True)
        return f"{cls.CACHE_PREFIX}:{hashlib.md5(sorted_params.encode()).hexdigest()}"

    @classmethod
    def get_cached_results(cls, cache_key: str) -> tuple[list[dict[str, Any]], int] | None:
        """Get cached search results."""
        try:
            cached_data = cache.get(cache_key, version=cls.CACHE_VERSION)
            if cached_data:
                logger.info(f"Cache hit for key: {cache_key}")
                return cached_data
            logger.debug(f"Cache miss for key: {cache_key}")
            return None
        except (InvalidCacheBackendError, RedisError, ConnectionError, TimeoutError, TypeError, ValueError) as e:
            logger.error(f"Cache retrieval error: {e}", exc_info=True)
            return None

    @classmethod
    def set_cached_results(cls, cache_key: str, books: list[dict[str, Any]], total_count: int) -> bool:
        """Cache search results."""
        try:
            cache.set(cache_key, (books, total_count), timeout=cls.DEFAULT_TIMEOUT, version=cls.CACHE_VERSION)
            logger.info(f"Cached results for key: {cache_key}")
            return True
        except (InvalidCacheBackendError, RedisError, ConnectionError, TimeoutError, TypeError, ValueError) as e:
            logger.error(f"Cache storage error: {e}", exc_info=True)
            return False

    @classmethod
    def invalidate_cache(cls, pattern: str | None = None) -> None:
        """Invalidate cache entries matching the pattern."""
        try:
            cache_keys = getattr(cache, "keys", None)
            if not callable(cache_keys):
                return

            keys = cache_keys(f"{cls.CACHE_PREFIX}:{pattern}*") if pattern else cache_keys(f"{cls.CACHE_PREFIX}:*")

            for key in keys:
                cache.delete(key, version=cls.CACHE_VERSION)
            logger.info(f"Invalidated {len(keys)} cache entries")
        except (InvalidCacheBackendError, RedisError, ConnectionError, TimeoutError, TypeError, ValueError) as e:
            logger.error(f"Cache invalidation error: {e}", exc_info=True)

    @classmethod
    def warm_cache(cls, common_queries: list[str]) -> None:
        """Warm up the cache with common search queries."""
        for query in common_queries:
            try:
                books, total_count = DatabaseSearchService.search_books(query=query, page=1, page_size=10)
                params = {"query": query, "page": 1, "page_size": 10, "filters": {}}
                cache_key = cls.generate_cache_key(params)
                cls.set_cached_results(cache_key, books, total_count)
                logger.info(f"Warmed cache for query: {query}")
            except (DatabaseError, RedisError, RuntimeError, TypeError, ValueError) as e:
                logger.error(f"Cache warming error for query {query}: {e}", exc_info=True)


class SearchRateThrottle(UserRateThrottle):
    """Custom rate throttle for search requests."""

    rate = "10000/hour"  # Adjust based on your needs

    def throttle_failure(self) -> None:
        """Custom throttle failure message."""
        raise Throttled(
            detail={
                "error": "Rate limit exceeded",
                "message": f"You have exceeded the rate limit of {self.rate}. Please try again later.",
                "retry_after": self.wait(),
            }
        )


class BookSearchPaginationSerializer(serializers.Serializer):
    current_page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_count = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()


class BookSearchResponseSerializer(serializers.Serializer):
    query = serializers.CharField()
    results = serializers.ListField(child=serializers.DictField())
    pagination = BookSearchPaginationSerializer()
    filters_applied = serializers.DictField()
    include_external = serializers.BooleanField()


class BookSearchAPIView(APIView):
    """
    API view for searching books using database full-text search.
    Supports filtering, pagination, and fallback to external APIs.
    """

    throttle_classes = [SearchRateThrottle]

    def _validate_search_params(self, request: Request) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        """
        Validate and normalize search parameters.
        Returns a tuple of (normalized_parameters, error_response).
        If validation fails, returns (None, error_response).
        """
        try:
            # Get query parameter
            query = request.GET.get("q", "").strip()
            if not query:
                return None, {
                    "error": "Missing required parameter",
                    "message": "Search query (q) is required",
                    "status": status.HTTP_400_BAD_REQUEST,
                }

            if len(query) < 2:
                return None, {
                    "error": "Invalid query length",
                    "message": "Search query must be at least 2 characters long",
                    "status": status.HTTP_400_BAD_REQUEST,
                }

            # Get pagination parameters
            try:
                page = max(1, int(request.GET.get("page", 1)))
                page_size = min(max(1, int(request.GET.get("page_size", 10))), 50)
            except ValueError:
                return None, {
                    "error": "Invalid pagination parameters",
                    "message": "Page and page_size must be positive integers",
                    "status": status.HTTP_400_BAD_REQUEST,
                }

            # Build filters dictionary
            filters: dict[str, Any] = {}

            # Genre filter
            genres = request.GET.get("genres")
            if genres:
                genre_list = [genre.strip() for genre in genres.split(",") if genre.strip()]
                if not genre_list:
                    return None, {
                        "error": "Invalid genre filter",
                        "message": "At least one valid genre must be provided",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }
                filters["genres"] = genre_list

            # Rating filter
            min_rating = request.GET.get("min_rating")
            if min_rating:
                try:
                    rating = float(min_rating)
                    if not 0 <= rating <= 5:
                        return None, {
                            "error": "Invalid rating filter",
                            "message": "Rating must be between 0 and 5",
                            "status": status.HTTP_400_BAD_REQUEST,
                        }
                    filters["min_rating"] = rating
                except ValueError:
                    return None, {
                        "error": "Invalid rating filter",
                        "message": "Rating must be a valid number",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }

            # Publication date filters
            pub_date_from = request.GET.get("pub_date_from")
            if pub_date_from:
                try:
                    from_date = datetime.strptime(pub_date_from, "%Y-%m-%d")
                    if from_date > datetime.now():
                        return None, {
                            "error": "Invalid publication date",
                            "message": "Publication date cannot be in the future",
                            "status": status.HTTP_400_BAD_REQUEST,
                        }
                    filters["pub_date_from"] = pub_date_from
                except ValueError:
                    return None, {
                        "error": "Invalid publication date format",
                        "message": "Publication date must be in YYYY-MM-DD format",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }

            pub_date_to = request.GET.get("pub_date_to")
            if pub_date_to:
                try:
                    to_date = datetime.strptime(pub_date_to, "%Y-%m-%d")
                    if pub_date_from and to_date < from_date:
                        return None, {
                            "error": "Invalid date range",
                            "message": "End date must be after start date",
                            "status": status.HTTP_400_BAD_REQUEST,
                        }
                    filters["pub_date_to"] = pub_date_to
                except ValueError:
                    return None, {
                        "error": "Invalid publication date format",
                        "message": "Publication date must be in YYYY-MM-DD format",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }

            # Author filter
            authors = request.GET.get("authors")
            if authors:
                author_list = [author.strip() for author in authors.split(",") if author.strip()]
                if not author_list:
                    return None, {
                        "error": "Invalid author filter",
                        "message": "At least one valid author must be provided",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }
                filters["author"] = author_list

            # Number of pages filter
            num_pages = request.GET.get("num_pages")
            if num_pages:
                try:
                    pages = int(num_pages)
                    if pages <= 0:
                        return None, {
                            "error": "Invalid page count",
                            "message": "Number of pages must be positive",
                            "status": status.HTTP_400_BAD_REQUEST,
                        }
                    filters["num_pages"] = pages
                except ValueError:
                    return None, {
                        "error": "Invalid page count",
                        "message": "Number of pages must be a valid integer",
                        "status": status.HTTP_400_BAD_REQUEST,
                    }

            return {
                "query": query,
                "page": page,
                "page_size": page_size,
                "filters": filters,
                "include_external": request.GET.get("include_external", "true").lower() == "true",
            }, None

        except (AttributeError, TypeError, ValueError) as e:
            logger.error(f"Error validating search parameters: {e}", exc_info=True)
            return None, {"error": "Validation error", "message": str(e), "status": status.HTTP_400_BAD_REQUEST}

    def _validate_search_results(self, books: list[Any], total_count: int) -> tuple[bool, dict[str, Any] | None]:
        """
        Validate search results for consistency and quality.
        Returns a tuple of (is_valid, error_response).
        """
        if not isinstance(books, list):
            return False, {
                "error": "Invalid search results",
                "message": "Search results must be a list",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }

        if total_count < 0:
            return False, {
                "error": "Invalid total count",
                "message": "Total count cannot be negative",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }

        if len(books) > total_count:
            return False, {
                "error": "Invalid result count",
                "message": "Number of results exceeds total count",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }

        return True, None

    @extend_schema(
        parameters=[
            OpenApiParameter("q", str, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("page", int, OpenApiParameter.QUERY),
            OpenApiParameter("page_size", int, OpenApiParameter.QUERY),
            OpenApiParameter("genres", str, OpenApiParameter.QUERY),
            OpenApiParameter("min_rating", float, OpenApiParameter.QUERY),
            OpenApiParameter("pub_date_from", str, OpenApiParameter.QUERY),
            OpenApiParameter("pub_date_to", str, OpenApiParameter.QUERY),
            OpenApiParameter("authors", str, OpenApiParameter.QUERY),
            OpenApiParameter("num_pages", int, OpenApiParameter.QUERY),
            OpenApiParameter("include_external", bool, OpenApiParameter.QUERY),
        ],
        responses={
            200: BookSearchResponseSerializer,
            400: OpenApiResponse(description="Invalid search parameters."),
            429: OpenApiResponse(description="Search rate limit exceeded."),
            500: OpenApiResponse(description="Search service error."),
        },
    )
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle GET requests for book search.

        Query parameters:
        - q: Search query (required)
        - page: Page number (default: 1)
        - page_size: Number of results per page (default: 10, max: 50)
        - genres: Comma-separated list of genres to filter by
        - min_rating: Minimum rating filter (0-5)
        - pub_date_from: Publication date from (YYYY-MM-DD)
        - pub_date_to: Publication date to (YYYY-MM-DD)
        - authors: Comma-separated list of author names to filter by
        - num_pages: Minimum number of pages
        - include_external: Whether to queue external catalog enrichment on local misses (default: true)

        Example request:
        /api/v1/books/search-results/?q=python&genres=Fiction,Mystery&authors=John Smith,Jane Doe&min_rating=4.0
        """
        try:
            # Validate search parameters
            params, error = self._validate_search_params(request)
            if error or params is None:
                error = error or {
                    "error": "Validation error",
                    "message": "Invalid search parameters",
                    "status": status.HTTP_400_BAD_REQUEST,
                }
                return Response({"error": error["error"], "message": error["message"]}, status=error["status"])

            # Try to get from cache
            cache_key = CacheManager.generate_cache_key(params)
            cached_results = CacheManager.get_cached_results(cache_key)

            if cached_results:
                books, total_count = cached_results
            else:
                # Search using the service
                try:
                    books, total_count = DatabaseSearchService.search_books(
                        query=params["query"],
                        page=params["page"],
                        page_size=params["page_size"],
                        filters=params["filters"],
                        include_external=params["include_external"],
                    )

                    # Cache the results
                    if books:
                        CacheManager.set_cached_results(cache_key, books, total_count)

                except (DatabaseError, RedisError, RuntimeError, TypeError, ValueError) as e:
                    logger.error(f"Search service error: {e}", exc_info=True)
                    return Response(
                        {
                            "error": "Search service error",
                            "message": "An error occurred while searching. Please try again.",
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

            # Validate search results
            is_valid, error = self._validate_search_results(books, total_count)
            if not is_valid:
                error = error or {
                    "error": "Invalid search results",
                    "message": "Search results could not be validated",
                    "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                }
                return Response({"error": error["error"], "message": error["message"]}, status=error["status"])

            # Calculate pagination info
            total_pages = (total_count + params["page_size"] - 1) // params["page_size"]
            has_next = params["page"] < total_pages
            has_previous = params["page"] > 1

            # Prepare response
            response_data = {
                "query": params["query"],
                "results": books,
                "pagination": {
                    "current_page": params["page"],
                    "page_size": params["page_size"],
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_previous": has_previous,
                },
                "filters_applied": params["filters"],
                "include_external": params["include_external"],
            }

            logger.info(
                f"Search completed for query: '{params['query']}', "
                f"returned {len(books)} results, "
                f"page {params['page']} of {total_pages}"
            )

            return Response(response_data, status=status.HTTP_200_OK)

        except Throttled as e:
            logger.warning(f"Rate limit exceeded for request: {request.GET}")
            return Response(
                {"error": "Rate limit exceeded", "message": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        except (AttributeError, KeyError, TypeError, ValueError, DatabaseError, RedisError) as e:
            logger.error(f"Search API error: {e}", exc_info=True)
            return Response(
                {"error": "Internal server error", "message": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
