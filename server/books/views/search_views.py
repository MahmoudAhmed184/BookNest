from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle
from django.core.cache import cache
from django.conf import settings
from books.models import Book
from books.utils.search_service import PostgreSQLSearchService
from books.utils.external_api_clients import search_external_apis
from books.utils.book_normalizer import BookNormalizer
from books.logging_config import logger
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple, List
import hashlib
import json
from functools import lru_cache
from django.core.cache.backends.base import DEFAULT_TIMEOUT
from rest_framework.exceptions import Throttled
from django.core.exceptions import ValidationError

class CacheManager:
    """Manages caching operations for the search API."""
    
    CACHE_VERSION = '1.0'  # Increment this when cache structure changes
    CACHE_PREFIX = f"{settings.CACHE_KEY_PREFIX}:search"
    DEFAULT_TIMEOUT = 3600  # 1 hour
    SHORT_TIMEOUT = 300    # 5 minutes
    LONG_TIMEOUT = 86400   # 24 hours
    
    @classmethod
    def generate_cache_key(cls, params: Dict[str, Any]) -> str:
        """Generate a unique cache key for the search parameters."""
        # Sort parameters to ensure consistent key generation
        sorted_params = json.dumps(params, sort_keys=True)
        return f"{cls.CACHE_PREFIX}:{hashlib.md5(sorted_params.encode()).hexdigest()}"
    
    @classmethod
    def get_cached_results(cls, cache_key: str) -> Optional[Tuple[List[Dict[str, Any]], int]]:
        """Get cached search results."""
        try:
            cached_data = cache.get(cache_key, version=cls.CACHE_VERSION)
            if cached_data:
                logger.info(f"Cache hit for key: {cache_key}")
                return cached_data
            logger.debug(f"Cache miss for key: {cache_key}")
            return None
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}", exc_info=True)
            return None
    
    @classmethod
    def set_cached_results(cls, cache_key: str, books: List[Dict[str, Any]], total_count: int) -> bool:
        """Cache search results."""
        try:
            cache.set(
                cache_key,
                (books, total_count),
                timeout=cls.DEFAULT_TIMEOUT,
                version=cls.CACHE_VERSION
            )
            logger.info(f"Cached results for key: {cache_key}")
            return True
        except Exception as e:
            logger.error(f"Cache storage error: {e}", exc_info=True)
            return False
    
    @classmethod
    def invalidate_cache(cls, pattern: str = None) -> None:
        """Invalidate cache entries matching the pattern."""
        try:
            if pattern:
                keys = cache.keys(f"{cls.CACHE_PREFIX}:{pattern}*")
            else:
                keys = cache.keys(f"{cls.CACHE_PREFIX}:*")
            
            for key in keys:
                cache.delete(key, version=cls.CACHE_VERSION)
            logger.info(f"Invalidated {len(keys)} cache entries")
        except Exception as e:
            logger.error(f"Cache invalidation error: {e}", exc_info=True)
    
    @classmethod
    def warm_cache(cls, common_queries: List[str]) -> None:
        """Warm up the cache with common search queries."""
        for query in common_queries:
            try:
                books, total_count = PostgreSQLSearchService.search_books(
                    query=query,
                    page=1,
                    page_size=10
                )
                params = {
                    'query': query,
                    'page': 1,
                    'page_size': 10,
                    'filters': {}
                }
                cache_key = cls.generate_cache_key(params)
                cls.set_cached_results(cache_key, books, total_count)
                logger.info(f"Warmed cache for query: {query}")
            except Exception as e:
                logger.error(f"Cache warming error for query {query}: {e}", exc_info=True)

class SearchRateThrottle(UserRateThrottle):
    """Custom rate throttle for search requests."""
    rate = '10000/hour'  # Adjust based on your needs
    
    def throttle_failure(self):
        """Custom throttle failure message."""
        raise Throttled(
            detail={
                'error': 'Rate limit exceeded',
                'message': f'You have exceeded the rate limit of {self.rate}. Please try again later.',
                'retry_after': self.wait()
            }
        )

class BookSearchAPIView(APIView):
    """
    API view for searching books using PostgreSQL full-text search.
    Supports filtering, pagination, and fallback to external APIs.
    """
    throttle_classes = [SearchRateThrottle]
    
    def _validate_search_params(self, request) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Validate and normalize search parameters.
        Returns a tuple of (normalized_parameters, error_response).
        If validation fails, returns (None, error_response).
        """
        try:
            # Get query parameter
            query = request.GET.get('q', '').strip()
            if not query:
                return None, {
                    'error': 'Missing required parameter',
                    'message': 'Search query (q) is required',
                    'status': status.HTTP_400_BAD_REQUEST
                }
            
            if len(query) < 2:
                return None, {
                    'error': 'Invalid query length',
                    'message': 'Search query must be at least 2 characters long',
                    'status': status.HTTP_400_BAD_REQUEST
                }
            
            # Get pagination parameters
            try:
                page = max(1, int(request.GET.get('page', 1)))
                page_size = min(max(1, int(request.GET.get('page_size', 10))), 50)
            except ValueError:
                return None, {
                    'error': 'Invalid pagination parameters',
                    'message': 'Page and page_size must be positive integers',
                    'status': status.HTTP_400_BAD_REQUEST
                }
            
            # Build filters dictionary
            filters = {}
            
            # Genre filter
            genres = request.GET.get('genres')
            if genres:
                genre_list = [genre.strip() for genre in genres.split(',') if genre.strip()]
                if not genre_list:
                    return None, {
                        'error': 'Invalid genre filter',
                        'message': 'At least one valid genre must be provided',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
                filters['genres'] = genre_list
            
            # Rating filter
            min_rating = request.GET.get('min_rating')
            if min_rating:
                try:
                    rating = float(min_rating)
                    if not 0 <= rating <= 5:
                        return None, {
                            'error': 'Invalid rating filter',
                            'message': 'Rating must be between 0 and 5',
                            'status': status.HTTP_400_BAD_REQUEST
                        }
                    filters['min_rating'] = rating
                except ValueError:
                    return None, {
                        'error': 'Invalid rating filter',
                        'message': 'Rating must be a valid number',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
            
            # Publication date filters
            pub_date_from = request.GET.get('pub_date_from')
            if pub_date_from:
                try:
                    from_date = datetime.strptime(pub_date_from, '%Y-%m-%d')
                    if from_date > datetime.now():
                        return None, {
                            'error': 'Invalid publication date',
                            'message': 'Publication date cannot be in the future',
                            'status': status.HTTP_400_BAD_REQUEST
                        }
                    filters['pub_date_from'] = pub_date_from
                except ValueError:
                    return None, {
                        'error': 'Invalid publication date format',
                        'message': 'Publication date must be in YYYY-MM-DD format',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
            
            pub_date_to = request.GET.get('pub_date_to')
            if pub_date_to:
                try:
                    to_date = datetime.strptime(pub_date_to, '%Y-%m-%d')
                    if pub_date_from and to_date < from_date:
                        return None, {
                            'error': 'Invalid date range',
                            'message': 'End date must be after start date',
                            'status': status.HTTP_400_BAD_REQUEST
                        }
                    filters['pub_date_to'] = pub_date_to
                except ValueError:
                    return None, {
                        'error': 'Invalid publication date format',
                        'message': 'Publication date must be in YYYY-MM-DD format',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
            
            # Author filter
            authors = request.GET.get('authors')
            if authors:
                author_list = [author.strip() for author in authors.split(',') if author.strip()]
                if not author_list:
                    return None, {
                        'error': 'Invalid author filter',
                        'message': 'At least one valid author must be provided',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
                filters['author'] = author_list
            
            # Number of pages filter
            num_pages = request.GET.get('num_pages')
            if num_pages:
                try:
                    pages = int(num_pages)
                    if pages <= 0:
                        return None, {
                            'error': 'Invalid page count',
                            'message': 'Number of pages must be positive',
                            'status': status.HTTP_400_BAD_REQUEST
                        }
                    filters['num_pages'] = pages
                except ValueError:
                    return None, {
                        'error': 'Invalid page count',
                        'message': 'Number of pages must be a valid integer',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
            
            return {
                'query': query,
                'page': page,
                'page_size': page_size,
                'filters': filters,
                'include_external': request.GET.get('include_external', 'false').lower() == 'true'
            }, None
            
        except Exception as e:
            logger.error(f"Error validating search parameters: {e}", exc_info=True)
            return None, {
                'error': 'Validation error',
                'message': str(e),
                'status': status.HTTP_400_BAD_REQUEST
            }
    
    def _validate_search_results(self, books: list, total_count: int) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate search results for consistency and quality.
        Returns a tuple of (is_valid, error_response).
        """
        if not isinstance(books, list):
            return False, {
                'error': 'Invalid search results',
                'message': 'Search results must be a list',
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR
            }
        
        if total_count < 0:
            return False, {
                'error': 'Invalid total count',
                'message': 'Total count cannot be negative',
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR
            }
        
        if len(books) > total_count:
            return False, {
                'error': 'Invalid result count',
                'message': 'Number of results exceeds total count',
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR
            }
        
        return True, None
    
    def get(self, request):
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
        - include_external: Whether to include results from external APIs (default: false)
        
        Example request:
        /api/books/search/?q=python&genres=Fiction,Mystery&authors=John Smith,Jane Doe&min_rating=4.0
        """
        try:
            # Validate search parameters
            params, error = self._validate_search_params(request)
            if error:
                return Response(
                    {'error': error['error'], 'message': error['message']},
                    status=error['status']
                )
            
            # Try to get from cache
            cache_key = CacheManager.generate_cache_key(params)
            cached_results = CacheManager.get_cached_results(cache_key)
            
            if cached_results:
                books, total_count = cached_results
            else:
            # Search using the service
                try:
                    books, total_count = PostgreSQLSearchService.search_books(
                        query=params['query'],
                        page=params['page'],
                        page_size=params['page_size'],
                        filters=params['filters']
                            )
                    
                    # Cache the results
                    CacheManager.set_cached_results(cache_key, books, total_count)
                    
                except Exception as e:
                    logger.error(f"Search service error: {e}", exc_info=True)
                    return Response(
                        {
                            'error': 'Search service error',
                            'message': 'An error occurred while searching. Please try again.'
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # Validate search results
            is_valid, error = self._validate_search_results(books, total_count)
            if not is_valid:
                return Response(
                    {'error': error['error'], 'message': error['message']},
                    status=error['status']
            )
            
            # Calculate pagination info
            total_pages = (total_count + params['page_size'] - 1) // params['page_size']
            has_next = params['page'] < total_pages
            has_previous = params['page'] > 1
            
            # Prepare response
            response_data = {
                'query': params['query'],
                'results': books,
                'pagination': {
                    'current_page': params['page'],
                    'page_size': params['page_size'],
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_previous': has_previous
                },
                'filters_applied': params['filters'],
                'include_external': params['include_external']
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
                {'error': 'Rate limit exceeded', 'message': str(e)},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        except Exception as e:
            logger.error(f"Search API error: {e}", exc_info=True)
            return Response(
                {
                    'error': 'Internal server error',
                    'message': 'An unexpected error occurred. Please try again later.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )