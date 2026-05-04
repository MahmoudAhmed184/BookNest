import logging
import socket
from urllib.parse import urlparse

from celery import shared_task
from django.conf import settings
from django.core.cache import cache

from apps.books.models import Book
from apps.books.utils.book_service import save_external_book
from apps.books.utils.external_api_clients import search_external_apis

logger = logging.getLogger(__name__)


def _celery_broker_is_reachable(timeout=0.2):
    broker_url = getattr(settings, "CELERY_BROKER_URL", "")
    parsed_url = urlparse(broker_url)

    if parsed_url.scheme not in {"redis", "rediss"}:
        return True

    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or 6379

    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@shared_task
def sync_external_books():
    """
    Background task to sync books from external APIs.
    This task should be scheduled to run periodically (e.g., daily).
    """
    try:
        # Get popular search terms from cache or use defaults
        popular_terms = cache.get(f"{settings.CACHE_KEY_PREFIX}:popular_terms")
        if not popular_terms:
            popular_terms = [
                "fiction",
                "science",
                "history",
                "biography",
                "technology",
                "philosophy",
                "art",
                "business",
            ]

        for term in popular_terms:
            try:
                # Search external APIs
                external_books = search_external_apis(term, max_retries=3, timeout=15)

                if external_books:
                    # Save books to database
                    for book_data in external_books:
                        try:
                            save_external_book(book_data)
                        except Exception as e:
                            logger.error(f"Error saving external book: {e}")
                            continue

                    logger.info(f"Successfully synced books for term: {term}")

            except Exception as e:
                logger.error(f"Error syncing books for term {term}: {e}")
                continue

        # Update popular terms based on recent searches
        update_popular_terms()

    except Exception as e:
        logger.error(f"Error in sync_external_books task: {e}")


@shared_task
def sync_external_books_for_query(query: str, page_size: int = 20):
    """
    Background task that enriches the local catalog for a user search query.
    Search requests never wait on this task.
    """
    try:
        external_books = search_external_apis(query, max_retries=1, timeout=8)[
            :page_size
        ]
        saved_count = 0

        for book_data in external_books:
            try:
                if save_external_book(book_data):
                    saved_count += 1
            except Exception as exc:
                logger.warning(
                    "Error saving external book for query '%s': %s", query, exc
                )

        logger.info("Saved %s external books for query: %s", saved_count, query)
        return saved_count
    except Exception as exc:
        logger.error(
            "External book sync failed for query '%s': %s", query, exc, exc_info=True
        )
        return 0


def enqueue_sync_external_books_for_query(query: str, page_size: int = 20):
    if (
        not getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False)
        and not _celery_broker_is_reachable()
    ):
        raise ConnectionError("Celery broker is not reachable")

    return sync_external_books_for_query.apply_async(
        kwargs={
            "query": query,
            "page_size": page_size,
        },
        retry=False,
    )


def update_popular_terms():
    """
    Update the list of popular search terms based on recent searches.
    """
    try:
        # Get recent searches from cache
        recent_searches = cache.get(f"{settings.CACHE_KEY_PREFIX}:recent_searches", [])

        if recent_searches:
            # Count term frequencies
            term_freq = {}
            for term in recent_searches:
                term_freq[term] = term_freq.get(term, 0) + 1

            # Get top 10 terms
            popular_terms = sorted(term_freq.items(), key=lambda x: x[1], reverse=True)[
                :10
            ]
            popular_terms = [term for term, _ in popular_terms]

            # Cache popular terms
            cache.set(
                f"{settings.CACHE_KEY_PREFIX}:popular_terms",
                popular_terms,
                timeout=60 * 60 * 24,  # 24 hours
            )

            # Clear recent searches
            cache.delete(f"{settings.CACHE_KEY_PREFIX}:recent_searches")

    except Exception as e:
        logger.error(f"Error updating popular terms: {e}")


@shared_task
def update_book_metadata():
    """
    Background task to update book metadata (ratings, reviews, etc.).
    This task should be scheduled to run periodically (e.g., weekly).
    """
    try:
        # Get books that haven't been updated recently
        books = Book.objects.filter(last_updated__isnull=True).order_by("?")[
            :100
        ]  # Random sample of 100 books

        for book in books:
            try:
                # Update book metadata from external APIs
                # Implementation depends on your external API structure
                pass

            except Exception as e:
                logger.error(f"Error updating metadata for book {book.isbn13}: {e}")
                continue

    except Exception as e:
        logger.error(f"Error in update_book_metadata task: {e}")
