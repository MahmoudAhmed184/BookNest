from __future__ import annotations

from typing import TYPE_CHECKING, Any

import requests
from django.db import DatabaseError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.books.logging_config import logger
from apps.books.selectors import related_suggestion_books, suggestion_reference_book
from apps.books.utils.book_normalizer import BookNormalizer
from apps.books.utils.external_api_clients import search_external_apis
from apps.books.utils.search_service import DatabaseSearchService

if TYPE_CHECKING:
    from rest_framework.request import Request

    from apps.books.models import Book


class BookSuggestionAPIView(APIView):
    """
    API view for getting book title suggestions using database.
    Provides real-time suggestions based on partial queries.
    """

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle GET requests for book suggestions.

        Query parameters:
        - q: Partial search query (required)
        - limit: Maximum number of suggestions (default: 5, max: 20)
        """
        try:
            # Get query parameter
            query = request.GET.get("q", "").strip()
            if not query:
                return Response(
                    {"error": 'Search query parameter "q" is required'}, status=status.HTTP_400_BAD_REQUEST
                )

            # Get limit parameter
            try:
                limit = min(int(request.GET.get("limit", 5)), 20)  # Max 20 suggestions
            except ValueError:
                return Response({"error": "Invalid limit parameter"}, status=status.HTTP_400_BAD_REQUEST)

            # Get suggestions
            suggestions = DatabaseSearchService.get_suggestions(query, limit)

            # Normalize suggestions
            normalized_suggestions = []
            for suggestion in suggestions:
                normalized_suggestion = BookNormalizer.normalize(suggestion, "database")
                normalized_suggestions.append(normalized_suggestion)

                # Log each suggestion
                author_names = ", ".join(
                    [
                        author["name"] if isinstance(author, dict) else author
                        for author in normalized_suggestion["authors"]
                    ]
                )
                genre_names = ", ".join(normalized_suggestion["genres"])
                logger.info(
                    f"Suggestion: '{normalized_suggestion['title']}' by {author_names} with genres: {genre_names}"
                )

            # Prepare response
            response_data = {
                "query": query,
                "suggestions": normalized_suggestions,
                "count": len(normalized_suggestions),
            }

            logger.info(f"Suggestions completed for query: '{query}', found {len(normalized_suggestions)} suggestions")
            return Response(response_data, status=status.HTTP_200_OK)

        except (DatabaseError, RuntimeError, TypeError, ValueError, KeyError) as e:
            logger.error(f"Suggestions API error: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while getting suggestions. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RelatedBookSuggestionAPIView(APIView):
    """
    API view for getting book suggestions based on a specific book.
    Provides suggestions based on the book's authors and genres.
    """

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle GET requests for related book suggestions.

        Query parameters:
        - book_id: ISBN13 of the book to get suggestions for
        - title: Title of the book to get suggestions for (used if book_id not provided)
        - limit: Maximum number of suggestions (default: 5, max: 20)
        - include_external: Whether to include results from external APIs (default: false)
        """
        try:
            # Get book identifier (either book_id or title)
            book_id = request.GET.get("book_id", "").strip()
            title = request.GET.get("title", "").strip()

            if not book_id and not title:
                return Response(
                    {"error": "Either book_id or title parameter is required"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Get limit parameter
            try:
                limit = min(int(request.GET.get("limit", 5)), 20)  # Max 20 suggestions
            except ValueError:
                return Response({"error": "Invalid limit parameter"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if external results should be included
            include_external = request.GET.get("include_external", "false").lower() == "true"

            reference_book = suggestion_reference_book(book_id=book_id or None, title=title or None)

            if not reference_book:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

            # Get local suggestions based on the reference book
            local_suggestions = self._get_local_suggestions(reference_book, limit)

            # Normalize local suggestions
            normalized_local_suggestions = []
            for suggestion in local_suggestions:
                normalized_suggestion = BookNormalizer.normalize(suggestion, "database")
                normalized_local_suggestions.append(normalized_suggestion)

                # Log each suggestion
                author_names = ", ".join(
                    [
                        author["name"] if isinstance(author, dict) else author
                        for author in normalized_suggestion["authors"]
                    ]
                )
                genre_names = ", ".join(normalized_suggestion["genres"])
                logger.info(
                    "Local Suggestion: '%s' by %s with genres: %s",
                    normalized_suggestion["title"],
                    author_names,
                    genre_names,
                )

            # Get external suggestions if needed
            external_suggestions = []
            if include_external and len(local_suggestions) < limit:
                # Get author names and genres from reference book
                reference_author_names = [author.name for author in reference_book.authors.all()]
                genres = [genre.name for genre in reference_book.genres.all()]

                # Construct query for external APIs
                external_query = reference_book.title
                if reference_author_names:
                    external_query += f" {reference_author_names[0]}"
                if genres:
                    external_query += f" {genres[0]}"

                # Search external APIs
                external_books = self._search_external_apis(external_query)

                # Filter out the reference book and books already in local suggestions
                seen_isbns = {suggestion.get("isbn13") for suggestion in local_suggestions if suggestion.get("isbn13")}
                seen_isbns.add(reference_book.isbn13)

                for book in external_books:
                    if book.get("isbn13") and book.get("isbn13") not in seen_isbns:
                        # Normalize external book
                        normalized_book = BookNormalizer.normalize(book, book.get("source", "external"))
                        external_suggestions.append(normalized_book)
                        seen_isbns.add(normalized_book.get("isbn13"))

                        # Log external suggestion
                        author_names = ", ".join(
                            [
                                author["name"] if isinstance(author, dict) else author
                                for author in normalized_book["authors"]
                            ]
                        )
                        genre_names = ", ".join(normalized_book["genres"])
                        logger.info(
                            "External Suggestion: '%s' by %s from %s with genres: %s",
                            normalized_book["title"],
                            author_names,
                            normalized_book["source"],
                            genre_names,
                        )

                        # Stop if we have enough suggestions
                        if len(normalized_local_suggestions) + len(external_suggestions) >= limit:
                            break

            # Combine suggestions
            combined_suggestions = (
                normalized_local_suggestions + external_suggestions[: limit - len(normalized_local_suggestions)]
            )

            # Prepare response
            response_data = {
                "reference_book": {
                    "isbn13": reference_book.isbn13,
                    "title": reference_book.title,
                    "authors": [author.name for author in reference_book.authors.all()],
                },
                "suggestions": combined_suggestions,
                "count": len(combined_suggestions),
                "include_external": include_external,
            }

            logger.info(
                "Related suggestions completed for book: '%s', found %s suggestions",
                reference_book.title,
                len(combined_suggestions),
            )
            return Response(response_data, status=status.HTTP_200_OK)

        except (DatabaseError, RuntimeError, TypeError, ValueError, KeyError, requests.RequestException) as e:
            logger.error(f"Related suggestions API error: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while getting suggestions. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_local_suggestions(self, reference_book: Book, limit: int) -> list[dict[str, Any]]:
        """
        Get book suggestions from the local database based on a reference book.
        Suggestions are based on matching authors and genres.
        """
        try:
            return [
                DatabaseSearchService._book_to_dict(book)
                for book in related_suggestion_books(reference_book=reference_book, limit=limit)
            ]

        except (DatabaseError, TypeError, ValueError) as e:
            logger.error(f"Error getting local suggestions: {e}")
            return []

    def _search_external_apis(self, query: str) -> list[dict[str, Any]]:
        """
        Search for books in external APIs.
        """
        try:
            # Use the existing external API search function
            external_books = search_external_apis(query, max_retries=2, timeout=15)
            return external_books
        except (requests.RequestException, RuntimeError, TypeError, ValueError) as e:
            logger.error(f"Error searching external APIs for suggestions: {e}")
            return []
