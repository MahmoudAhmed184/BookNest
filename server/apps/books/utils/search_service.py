from typing import List, Dict, Any, Optional, Tuple
from django.core.paginator import Paginator, EmptyPage
from django.core.cache import cache
from django.conf import settings
from django.db import DatabaseError, connection
from django.db.models import Case, FloatField, IntegerField, Q, Value, When
from django.db.models.expressions import RawSQL
from apps.books.models import Book, BookSearchIndex
from apps.books.utils.external_api_clients import OpenLibraryClient, GoogleBooksClient, merge_book_results
from apps.books.utils.book_service import save_external_book
import logging
import asyncio
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import hashlib
import re

# Configure logging
logger = logging.getLogger(__name__)


class DatabaseSearchService:
    """
    Database-backed search service.
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
                    filters: Optional[Dict[str, Any]] = None,
                    include_external: bool = True) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search for books using the local full-text index.
        External catalog enrichment is queued asynchronously when requested.
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
        
        filters = filters or {}

        books, total_count = DatabaseSearchService._search_local_database(query, page, page_size, filters)
        logger.info(f"Found {len(books)} books in local database for query: {query}")
        
        if books:
            return books, total_count

        if include_external:
            DatabaseSearchService._enqueue_external_enrichment(query, page_size)

        return [], total_count
    
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
        full_text_results = DatabaseSearchService._search_full_text_index(query, page, page_size, filters or {})
        if full_text_results is not None:
            return full_text_results

        return DatabaseSearchService._search_local_database_fallback(query, page, page_size, filters)

    @staticmethod
    def _search_full_text_index(query: str, page: int, page_size: int,
                                filters: Dict[str, Any]) -> Optional[Tuple[List[Dict[str, Any]], int]]:
        if connection.vendor != 'mysql':
            return None

        boolean_query = DatabaseSearchService._to_boolean_full_text_query(query)
        if not boolean_query:
            return DatabaseSearchService._search_prefix_index(query, page, page_size, filters)

        try:
            score = RawSQL(
                'MATCH(document) AGAINST (%s IN BOOLEAN MODE)',
                [boolean_query],
                output_field=FloatField(),
            )
            queryset = (
                BookSearchIndex.objects
                .select_related('book')
                .prefetch_related('book__authors', 'book__genres')
                .annotate(score=score)
                .filter(score__gt=0)
            )
            queryset = DatabaseSearchService._apply_search_index_filters(queryset, filters)
            queryset = queryset.annotate(
                isbn_priority=Case(
                    When(isbn__iexact=query, then=Value(3)),
                    When(isbn__istartswith=query, then=Value(2)),
                    When(isbn__icontains=query, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                title_priority=Case(
                    When(title__iexact=query, then=Value(3)),
                    When(title__istartswith=query, then=Value(2)),
                    When(title__icontains=query, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                author_priority=Case(
                    When(authors__icontains=query, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            ).distinct().order_by(
                '-isbn_priority',
                '-title_priority',
                '-author_priority',
                '-score',
                'title',
            )

            total_count = queryset.count()
            offset = (page - 1) * page_size
            page_items = queryset[offset:offset + page_size]
            books = [
                DatabaseSearchService._book_to_dict(search_index.book)
                for search_index in page_items
            ]
            return books, total_count
        except DatabaseError as exc:
            logger.warning("Full-text search failed; using ORM fallback: %s", exc)
            return None

    @staticmethod
    def _search_prefix_index(query: str, page: int, page_size: int,
                             filters: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int]:
        try:
            queryset = (
                BookSearchIndex.objects
                .select_related('book')
                .prefetch_related('book__authors', 'book__genres')
                .filter(
                    Q(title__istartswith=query)
                    | Q(isbn__istartswith=query)
                    | Q(authors__istartswith=query)
                    | Q(genres__istartswith=query)
                )
            )
            queryset = DatabaseSearchService._apply_search_index_filters(queryset, filters)
            queryset = queryset.annotate(
                isbn_priority=Case(
                    When(isbn__iexact=query, then=Value(3)),
                    When(isbn__istartswith=query, then=Value(2)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                title_priority=Case(
                    When(title__iexact=query, then=Value(3)),
                    When(title__istartswith=query, then=Value(2)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            ).distinct().order_by(
                '-isbn_priority',
                '-title_priority',
                'title',
            )

            total_count = queryset.count()
            offset = (page - 1) * page_size
            page_items = queryset[offset:offset + page_size]
            books = [
                DatabaseSearchService._book_to_dict(search_index.book)
                for search_index in page_items
            ]
            return books, total_count
        except DatabaseError as exc:
            logger.warning("Prefix search failed; using ORM fallback: %s", exc)
            return DatabaseSearchService._search_local_database_fallback(query, page, page_size, filters)

    @staticmethod
    def _to_boolean_full_text_query(query: str) -> str:
        tokens = re.findall(r'[0-9A-Za-z]+', query)
        searchable_tokens = [token for token in tokens if len(token) >= 3]

        if not searchable_tokens:
            return ''

        return ' '.join(f'+{token}*' for token in searchable_tokens[:8])

    @staticmethod
    def _apply_search_index_filters(queryset, filters: Dict[str, Any]):
        if not filters:
            return queryset

        if 'genres' in filters:
            queryset = queryset.filter(book__genres__name__in=filters['genres'])

        if 'min_rating' in filters:
            queryset = queryset.filter(book__average_rate__gte=filters['min_rating'])

        if 'pub_date_from' in filters:
            queryset = queryset.filter(book__publication_date__gte=filters['pub_date_from'])

        if 'pub_date_to' in filters:
            queryset = queryset.filter(book__publication_date__lte=filters['pub_date_to'])

        if 'author' in filters:
            queryset = queryset.filter(book__authors__name__in=filters['author'])

        if 'num_pages' in filters:
            queryset = queryset.filter(book__number_of_pages__gte=filters['num_pages'])

        return queryset

    @staticmethod
    def _enqueue_external_enrichment(query: str, page_size: int) -> bool:
        query = query.strip()
        if len(query) < 3:
            return False

        cache_key = (
            f"{settings.CACHE_KEY_PREFIX}:external_search_enqueued:"
            f"{hashlib.md5(query.casefold().encode()).hexdigest()}"
        )
        if not cache.add(cache_key, True, timeout=60 * 60 * 6):
            return False

        try:
            from apps.books.tasks import enqueue_sync_external_books_for_query

            enqueue_sync_external_books_for_query(query=query, page_size=min(page_size, 40))
            logger.info("Queued external catalog enrichment for query: %s", query)
            return True
        except Exception as exc:
            cache.delete(cache_key)
            logger.warning("Could not queue external catalog enrichment for '%s': %s", query, exc)
            return False

    @staticmethod
    def _search_local_database_fallback(query: str, page: int, page_size: int,
                                        filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search books in the local database using portable ORM lookups.
        """
        try:
            logger.debug(f"Searching local database with query: {query}")
            filters = filters or {}

            queryset = Book.objects.prefetch_related('authors', 'genres')
            if query:
                queryset = queryset.filter(
                    Q(title__icontains=query)
                    | Q(description__icontains=query)
                    | Q(authors__name__icontains=query)
                    | Q(genres__name__icontains=query)
                    | Q(isbn13__icontains=query)
                    | Q(isbn__icontains=query)
                ).annotate(
                    title_priority=Case(
                        When(title__iexact=query, then=Value(3)),
                        When(title__istartswith=query, then=Value(2)),
                        When(title__icontains=query, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    author_priority=Case(
                        When(authors__name__icontains=query, then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                ).distinct()
            
            # Apply additional filters
            # if not filters:
            logger.debug(f"Applying filters: {filters}")
            queryset = DatabaseSearchService._apply_filters(queryset, filters)
            
            queryset = queryset.order_by('-title_priority', '-author_priority', 'title')
            
            # Get total count
            total_count = queryset.count()
            logger.debug(f"Found {total_count} total results in local database")
            
            # Apply pagination
            paginator = Paginator(queryset, page_size)
            try:
                page_obj = paginator.get_page(page)
                # Convert to list of dictionaries
                books = [DatabaseSearchService._book_to_dict(book) for book in page_obj.object_list]
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
            queryset = Book.objects.prefetch_related('authors', 'genres')
            
            # Apply filters
            if filters:
                logger.debug(f"Applying filters: {filters}")
                queryset = DatabaseSearchService._apply_filters(queryset, filters)
            
            # Order by average rating and title
            queryset = queryset.order_by('-average_rate', 'title')
            
            # Get total count
            total_count = queryset.count()
            logger.debug(f"Found {total_count} total books")
            
            # Apply pagination
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            # Convert to list of dictionaries
            books = [DatabaseSearchService._book_to_dict(book) for book in page_obj.object_list]
            
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
            if not filters:
                return queryset

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
            ).prefetch_related('authors')[:limit]
            
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
