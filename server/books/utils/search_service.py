from typing import List, Dict, Any, Optional, Tuple
from django.db import models
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.core.paginator import Paginator, EmptyPage
from django.core.cache import cache
from django.conf import settings
from django.db.models import Q
from books.models import Book, Author, Genre
from books.utils.external_api_clients import OpenLibraryClient, GoogleBooksClient, search_external_apis , merge_book_results
from books.utils.book_service import save_external_book
import logging
import asyncio
import aiohttp
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)


class PostgreSQLSearchService:
    """
    PostgreSQL-based search service using full-text search capabilities.
    Provides search functionality with filtering, pagination, and external API fallback.
    """
    
    # @staticmethod
    # def _generate_cache_key(query: str, page: int, page_size: int, filters: Optional[Dict[str, Any]] = None) -> str:
    #     """Generate a unique cache key for the search query."""
    #     key_parts = [query, str(page), str(page_size)]
    #     if filters:
    #         key_parts.append(json.dumps(filters, sort_keys=True))
    #     key_string = ':'.join(key_parts)
    #     return f"{settings.CACHE_KEY_PREFIX}:search:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    # @staticmethod
    # def _update_recent_searches(query: str):
    #     """Update the list of recent searches in cache."""
    #     try:
    #         recent_searches = cache.get(f"{settings.CACHE_KEY_PREFIX}:recent_searches", [])
    #         recent_searches.append(query)
    #         # Keep only last 1000 searches
    #         if len(recent_searches) > 1000:
    #             recent_searches = recent_searches[-1000:]
    #         cache.set(
    #             f"{settings.CACHE_KEY_PREFIX}:recent_searches",
    #             recent_searches,
    #             timeout=60 * 60 * 24  # 24 hours
    #         )
    #         logger.debug(f"Updated recent searches with query: {query}")
    #     except Exception as e:
    #         logger.error(f"Error updating recent searches: {e}", exc_info=True)
    
    @staticmethod
    def search_books(query: str, page: int = 1, page_size: int = 10, 
                    filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search for books using PostgreSQL full-text search with fallback to external APIs.
        Includes caching and parallel processing.
        """
        logger.info(f"Starting book search for query: {query}, page: {page}, page_size: {page_size}")
        
        # Validate pagination parameters
        try:
            page = max(1, int(page))  # Ensure page is at least 1
            page_size = max(1, min(int(page_size), 100))  # Ensure page_size is between 1 and 100
        except (ValueError, TypeError):
            logger.warning("Invalid pagination parameters, using defaults")
            page = 1
            page_size = 10
        
        # First try local database search
        books, total_count = PostgreSQLSearchService._search_local_database(query, page, page_size, filters)
        logger.info(f"Found {len(books)} books in local database for query: {query}")
        
        if books:
            return books, total_count
        
        logger.info(f"No local results for query: {query}, searching external APIs")
        return PostgreSQLSearchService._search_external_apis_parallel(query, page, page_size)
        # If no local results, check if we should fetch from external APIs
        # should_fetch_external = PostgreSQLSearchService._should_fetch_external(query)
        
        # if should_fetch_external:
        #     logger.info(f"No local results for query: {query}, searching external APIs")
        #     return PostgreSQLSearchService._search_external_apis_parallel(query, page, page_size)
        # else:
        #     logger.info(f"No local results for query: {query}, skipping external API search")
        #     return [], 0
    
    # @staticmethod
    # def _should_fetch_external(query: str) -> bool:
    #     """
    #     Determine if we should fetch from external APIs based on various factors.
    #     """
    #     try:
    #         # Check if query is too short
    #         if len(query.strip()) < 3:
    #             logger.debug(f"Query too short: {query}")
    #             return False
            
    #         # Check if we've searched this query recently
    #         recent_searches = cache.get(f"{settings.CACHE_KEY_PREFIX}:recent_searches", [])
    #         if query in recent_searches[-10:]:  # Last 10 searches
    #             logger.debug(f"Query recently searched: {query}")
    #             return False
            
    #         # Check if we have enough books in the database
    #         book_count = Book.objects.count()
    #         if book_count < 1000:  # Arbitrary threshold
    #             logger.debug(f"Database has only {book_count} books, will fetch external")
    #             return True
            
    #         # Check if we've updated books recently
    #         recent_updates = Book.objects.filter(
    #             last_updated__gte=datetime.now() - timedelta(days=1)
    #         ).count()
    #         if recent_updates > 100:  # Arbitrary threshold
    #             logger.debug(f"Recent updates count: {recent_updates}, skipping external fetch")
    #             return False
            
    #         logger.debug(f"Will fetch external results for query: {query}")
    #         return True
            
    #     except Exception as e:
    #         logger.error(f"Error checking if should fetch external: {e}", exc_info=True)
    #         return False
    
    @staticmethod
    def _search_local_database(query: str, page: int, page_size: int, 
                              filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search books in the local PostgreSQL database using full-text search.
        Optimized with GIN indexes and materialized views.
        """
        try:
            logger.debug(f"Searching local database with query: {query}")
            
            # Create search vectors for different fields with different weights
            search_vector = (
                SearchVector('title', weight='A') +  # Highest weight for title
                SearchVector('description', weight='B') +  # Medium weight for description
                SearchVector('authors__name', weight='A') +  # High weight for author names
                SearchVector('genres__name', weight='B') +  # Medium weight for genres
                SearchVector('number_of_pages', weight='C')  # Lower weight for number of pages
            )
            
            # Create search query with ranking
            search_query = SearchQuery(query)


            # Base queryset with search and ranking
            queryset = Book.objects.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                search=search_query
            ).select_related().prefetch_related('authors', 'genres')
            
            # Apply additional filters
            # if not filters:
            logger.debug(f"Applying filters: {filters}")
            queryset = PostgreSQLSearchService._apply_filters(queryset, filters)
            
            # Order by relevance (rank) and then by title
            queryset = queryset.order_by('-rank', 'title')
            
            # Get total count
            total_count = queryset.count()
            logger.debug(f"Found {total_count} total results in local database")
            
            # Apply pagination
            paginator = Paginator(queryset, page_size)
            try:
                page_obj = paginator.get_page(page)
                # Convert to list of dictionaries
                books = [PostgreSQLSearchService._book_to_dict(book) for book in page_obj.object_list]
                return books, total_count
            except EmptyPage:
                logger.warning(f"Page {page} is out of range, returning empty result")
                return [], total_count
            
        except Exception as e:
            logger.error(f"Database search error: {e}", exc_info=True)
            return [], 0
    
    @staticmethod
    def _search_external_apis_parallel(query: str, page: int, page_size: int) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search external APIs in parallel using our existing clients.
        """
        try:
            logger.info(f"Starting parallel external API search for query: {query}")
            
            # Create event loop for async operations
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def search_all_apis():
                try:
                    # Search both APIs concurrently with page_size
                    openlibrary_task = asyncio.create_task(
                        asyncio.to_thread(OpenLibraryClient.search_books, query, page_size)
                    )
                    googlebooks_task = asyncio.create_task(
                        asyncio.to_thread(GoogleBooksClient.search_books, query, page_size)
                    )
                    
                    # Wait for both tasks to complete
                    openlibrary_results, googlebooks_results = await asyncio.gather(
                        openlibrary_task, googlebooks_task
                    )
                    
                    # Merge and deduplicate results using merge_book_results
                    merged_results = merge_book_results(openlibrary_results, googlebooks_results)
                    logger.info(f"Retrieved and merged {len(merged_results)} results from external APIs")
                    
                    return merged_results
                    
                except Exception as e:
                    logger.error(f"Error in async external API search: {e}", exc_info=True)
                    return []
            
            # Run the async search
            external_books = loop.run_until_complete(search_all_apis())
            loop.close()
            
            if external_books:
                logger.info(f"Saving {len(external_books)} external books to database")
                # Save external books to database in parallel
                with ThreadPoolExecutor(max_workers=4) as executor:
                    executor.map(save_external_book, external_books)
                
                logger.debug("Cached external search results")
            
            # Apply pagination to merged results
            total_count = len(external_books)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Handle out of range pages
            if start_idx >= total_count:
                logger.warning(f"Page {page} is out of range for external results")
                return [], total_count
            
            # Get the paginated slice of results
            paginated_books = external_books[start_idx:end_idx]
            logger.info(f"Returning {len(paginated_books)} paginated results from external APIs")
            return paginated_books, total_count
            
        except Exception as e:
            logger.error(f"External API search error: {e}", exc_info=True)
            return [], 0
    
    @staticmethod
    def _get_all_books(page: int, page_size: int, filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get all books with optional filtering when no search query is provided.
        """
        try:
            logger.debug("Getting all books with filters")
            queryset = Book.objects.select_related().prefetch_related('authors', 'genres')
            
            # Apply filters
            if filters:
                logger.debug(f"Applying filters: {filters}")
                queryset = PostgreSQLSearchService._apply_filters(queryset, filters)
            
            # Order by average rating and title
            queryset = queryset.order_by('-average_rate', 'title')
            
            # Get total count
            total_count = queryset.count()
            logger.debug(f"Found {total_count} total books")
            
            # Apply pagination
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            # Convert to list of dictionaries
            books = [PostgreSQLSearchService._book_to_dict(book) for book in page_obj.object_list]
            
            return books, total_count
            
        except Exception as e:
            logger.error(f"Error getting all books: {e}", exc_info=True)
            return [], 0
    
    @staticmethod
    def _apply_filters(queryset, filters: Dict[str, Any]):
        """
        Apply filters to the queryset.
        """
        try:
            if 'genres' in filters:
                queryset = queryset.filter(genres__name__in=filters['genres'])
                logger.debug(f"Applied genre filter: {filters['genres']}")
            
            # Filter by minimum rating
            if 'min_rating' in filters:
                queryset = queryset.filter(average_rate__gte=filters['min_rating'])
                logger.debug(f"Applied min rating filter: {filters['min_rating']}")
            
            # Filter by publication date range
            if 'pub_date_from' in filters:
                queryset = queryset.filter(publication_date__gte=filters['pub_date_from'])
                logger.debug(f"Applied publication date from filter: {filters['pub_date_from']}")
                
                
            if 'pub_date_to' in filters:
                queryset = queryset.filter(publication_date__lte=filters['pub_date_to'])
                logger.debug(f"Applied publication date to filter: {filters['pub_date_to']}")
            

            if 'author' in filters:
                queryset = queryset.filter(authors__name__in = filters['author'])
                logger.debug(f"Applied author filter: {filters['author']}")
            
            # Filter by number of pages
            if 'num_pages' in filters:
                queryset = queryset.filter(number_of_pages__gte=filters['num_pages'])
                logger.debug(f"Applied number of pages filter: {filters['num_pages']}")
            
            
            return queryset
            
        except Exception as e:
            logger.error(f"Error applying filters: {e}", exc_info=True)
            return queryset
    
    @staticmethod
    @lru_cache(maxsize=1000)
    def _book_to_dict(book) -> Dict[str, Any]:
        """
        Convert a Book model instance to a dictionary.
        Cached for better performance.
        """
        try:
            return {
                'isbn13': book.isbn13,
                'isbn': book.isbn,
                'title': book.title,
                'authors': [author.name for author in book.authors.all()],
                'cover_img': book.cover_img,
                'publication_date': book.publication_date,
                'number_of_pages': book.number_of_pages,
                'description': book.description,
                'average_rate': float(book.average_rate) if book.average_rate else None,
                'genres': [genre.name for genre in book.genres.all()],
                'source': book.source,
                'last_updated': book.last_updated.isoformat() if book.last_updated else None
            }
        except Exception as e:
            logger.error(f"Error converting book to dictionary: {e}", exc_info=True)
            return {}
    
    @staticmethod
    def get_suggestions(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get book title suggestions based on partial query.
        Includes caching for better performance.
        """
        if not query.strip():
            return []
        
        cache_key = f"{settings.CACHE_KEY_PREFIX}:suggestions:{hashlib.md5(query.encode()).hexdigest()}"
        cached_suggestions = cache.get(cache_key)
        if cached_suggestions:
            logger.debug(f"Cache hit for suggestions: {query}")
            return cached_suggestions
        
        try:
            logger.debug(f"Getting suggestions for query: {query}")
            # Search for books with titles that start with the query
            books = Book.objects.filter(
                title__istartswith=query
            ).select_related().prefetch_related('authors')[:limit]
            
            suggestions = []
            for book in books:
                suggestions.append({
                    'isbn13': book.isbn13,
                    'title': book.title,
                    'authors': [author.name for author in book.authors.all()],
                    'cover_img': book.cover_img
                })
            
            # Cache suggestions for 5 minutes
            cache.set(cache_key, suggestions, 300)
            logger.debug(f"Found {len(suggestions)} suggestions")
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting suggestions: {e}", exc_info=True)
            return []