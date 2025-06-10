from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from books.models import Book, Author
from books.utils.search_service import PostgreSQLSearchService
from books.utils.external_api_clients import search_external_apis
from books.utils.book_normalizer import BookNormalizer
from books.logging_config import logger



class BookSuggestionAPIView(APIView):
    """
    API view for getting book title suggestions using PostgreSQL.
    Provides real-time suggestions based on partial queries.
    """
    
    def get(self, request):
        """
        Handle GET requests for book suggestions.
        
        Query parameters:
        - q: Partial search query (required)
        - limit: Maximum number of suggestions (default: 5, max: 20)
        """
        try:
            # Get query parameter
            query = request.GET.get('q', '').strip()
            if not query:
                return Response(
                    {'error': 'Search query parameter "q" is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get limit parameter
            try:
                limit = min(int(request.GET.get('limit', 5)), 20)  # Max 20 suggestions
            except ValueError:
                return Response(
                    {'error': 'Invalid limit parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get suggestions
            suggestions = PostgreSQLSearchService.get_suggestions(query, limit)
            
            # Normalize suggestions
            normalized_suggestions = []
            for suggestion in suggestions:
                normalized_suggestion = BookNormalizer.normalize(suggestion, 'database')
                normalized_suggestions.append(normalized_suggestion)
                
                # Log each suggestion
                author_names = ", ".join([author["name"] if isinstance(author, dict) else author 
                                      for author in normalized_suggestion["authors"]])
                genre_names = ", ".join(normalized_suggestion["genres"])
                logger.info(f"Suggestion: '{normalized_suggestion['title']}' by {author_names} with genres: {genre_names}")
            
            # Prepare response
            response_data = {
                'query': query,
                'suggestions': normalized_suggestions,
                'count': len(normalized_suggestions)
            }
            
            logger.info(f"Suggestions completed for query: '{query}', found {len(normalized_suggestions)} suggestions")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Suggestions API error: {e}", exc_info=True)
            return Response(
                {'error': 'An error occurred while getting suggestions. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RelatedBookSuggestionAPIView(APIView):
    """
    API view for getting book suggestions based on a specific book.
    Provides suggestions based on the book's authors and genres.
    """
    
    def get(self, request):
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
            book_id = request.GET.get('book_id', '').strip()
            title = request.GET.get('title', '').strip()
            
            if not book_id and not title:
                return Response(
                    {'error': 'Either book_id or title parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get limit parameter
            try:
                limit = min(int(request.GET.get('limit', 5)), 20)  # Max 20 suggestions
            except ValueError:
                return Response(
                    {'error': 'Invalid limit parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if external results should be included
            include_external = request.GET.get('include_external', 'false').lower() == 'true'
            
            # Find the reference book
            reference_book = None
            if book_id:
                reference_book = Book.objects.filter(isbn13=book_id).first()
            elif title:
                reference_book = Book.objects.filter(title__icontains=title).first()
            
            if not reference_book:
                return Response(
                    {'error': 'Book not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get local suggestions based on the reference book
            local_suggestions = self._get_local_suggestions(reference_book, limit)
            
            # Normalize local suggestions
            normalized_local_suggestions = []
            for suggestion in local_suggestions:
                normalized_suggestion = BookNormalizer.normalize(suggestion, 'database')
                normalized_local_suggestions.append(normalized_suggestion)
                
                # Log each suggestion
                author_names = ", ".join([author["name"] if isinstance(author, dict) else author 
                                      for author in normalized_suggestion["authors"]])
                genre_names = ", ".join(normalized_suggestion["genres"])
                logger.info(f"Local Suggestion: '{normalized_suggestion['title']}' by {author_names} with genres: {genre_names}")
            
            # Get external suggestions if needed
            external_suggestions = []
            if include_external and len(local_suggestions) < limit:
                # Get author names and genres from reference book
                author_names = [author.name for author in reference_book.authors.all()]
                genres = [genre.genre for genre in reference_book.genres.all()]
                
                # Construct query for external APIs
                external_query = reference_book.title
                if author_names:
                    external_query += f" {author_names[0]}"
                if genres:
                    external_query += f" {genres[0]}"
                
                # Search external APIs
                external_books = self._search_external_apis(external_query)
                
                # Filter out the reference book and books already in local suggestions
                seen_isbns = {suggestion.get('isbn13') for suggestion in local_suggestions if suggestion.get('isbn13')}
                seen_isbns.add(reference_book.isbn13)
                
                for book in external_books:
                    if book.get('isbn13') and book.get('isbn13') not in seen_isbns:
                        # Normalize external book
                        normalized_book = BookNormalizer.normalize(book, book.get('source', 'external'))
                        external_suggestions.append(normalized_book)
                        seen_isbns.add(normalized_book.get('isbn13'))
                        
                        # Log external suggestion
                        author_names = ", ".join([author["name"] if isinstance(author, dict) else author 
                                              for author in normalized_book["authors"]])
                        genre_names = ", ".join(normalized_book["genres"])
                        logger.info(f"External Suggestion: '{normalized_book['title']}' by {author_names} from {normalized_book['source']} with genres: {genre_names}")
                        
                        # Stop if we have enough suggestions
                        if len(normalized_local_suggestions) + len(external_suggestions) >= limit:
                            break
            
            # Combine suggestions
            combined_suggestions = normalized_local_suggestions + external_suggestions[:limit - len(normalized_local_suggestions)]
            
            # Prepare response
            response_data = {
                'reference_book': {
                    'isbn13': reference_book.isbn13,
                    'title': reference_book.title,
                    'authors': [author.name for author in reference_book.authors.all()],
                },
                'suggestions': combined_suggestions,
                'count': len(combined_suggestions),
                'include_external': include_external
            }
            
            logger.info(f"Related suggestions completed for book: '{reference_book.title}', found {len(combined_suggestions)} suggestions")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Related suggestions API error: {e}", exc_info=True)
            return Response(
                {'error': 'An error occurred while getting suggestions. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_local_suggestions(self, reference_book, limit):
        """
        Get book suggestions from the local database based on a reference book.
        Suggestions are based on matching authors and genres.
        """
        try:
            # Get authors and genres from the reference book
            author_ids = reference_book.authors.values_list('author_id', flat=True)
            genres = reference_book.genres.values_list('genre', flat=True)
            
            # Build query to find books with similar authors or genres
            query = Q()
            
            # Add author filter if we have authors
            if author_ids:
                query |= Q(authors__author_id__in=author_ids)
            
            # Add genre filter if we have genres
            if genres:
                query |= Q(genres__name__in=genres)
            
            # Exclude the reference book itself
            query &= ~Q(isbn13=reference_book.isbn13)
            
            # Get suggestions
            suggestions = Book.objects.filter(query).distinct()
            
            # Order by relevance (number of matching authors and genres)
            suggestions = sorted(
                suggestions,
                key=lambda book: (
                    # Count matching authors
                    len(set(book.authors.values_list('author_id', flat=True)) & set(author_ids)) +
                    # Count matching genres
                    len(set(book.genres.values_list('genre', flat=True)) & set(genres))
                ),
                reverse=True
            )
            
            # Limit results
            suggestions = suggestions[:limit]
            
            # Convert to dictionaries
            return [PostgreSQLSearchService._book_to_dict(book) for book in suggestions]
            
        except Exception as e:
            logger.error(f"Error getting local suggestions: {e}")
            return []
    
    def _search_external_apis(self, query):
        """
        Search for books in external APIs.
        """
        try:
            # Use the existing external API search function
            external_books = search_external_apis(query, max_retries=2, timeout=15)
            return external_books
        except Exception as e:
            logger.error(f"Error searching external APIs for suggestions: {e}")
            return []