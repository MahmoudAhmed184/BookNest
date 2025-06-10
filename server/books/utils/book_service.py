from typing import Dict, List, Any, Optional
import logging
import requests
from django.db import transaction
from django.utils import timezone
from books.models import Book, Author, BookAuthor, Genre
from books.utils.external_api_clients import search_external_apis
from datetime import datetime
from dateutil import parser
from django.db.models import Q
from django.db.models.functions import Length

# Configure logging
logger = logging.getLogger(__name__)


def parse_date(date_value):
    """Parse date from various formats into YYYY-MM-DD format."""
    if not date_value:
        return None
        
    try:
        # Handle integer years (e.g., 1998)
        if isinstance(date_value, int):
            return datetime(date_value, 1, 1).date()
            
        # Handle string dates
        if isinstance(date_value, str):
            # Handle BC dates (e.g., "c. 431 BC")
            if 'BC' in date_value.upper():
                year = int(''.join(filter(str.isdigit, date_value)))
                return datetime(-year, 1, 1).date()
                
            # Try parsing with dateutil
            return parser.parse(date_value).date()
            
        return None
    except Exception as e:
        logger.warning(f"Could not parse date: {date_value}, error: {e}")
        return None


@transaction.atomic
def save_external_book(book_data: Dict[str, Any]) -> Optional[Book]:
    """
    Save a book from external API to the database with improved data integrity.
    
    Args:
        book_data: Book data from external API
        
    Returns:
        Created Book instance or None if failed
    """
    # Validate required fields before attempting to save
    if not book_data.get('isbn13') or not book_data.get('title'):
        logger.warning("Cannot save book: missing required fields (isbn13 or title)")
        return None
    
    # # Check for network connectivity issues with cover image URL
    # if book_data.get('cover_img'):
    #     from books.utils.external_api_clients import check_network_connectivity
    #     if not check_network_connectivity():
    #         # If network is down, set cover_img to None to avoid connection errors
    #         logger.warning(f"Network connectivity issue detected. Setting cover_img to None for book {book_data['title']}")
    #         book_data['cover_img'] = None
        
    try:
        # Check if book already exists - use get_or_none pattern to avoid exceptions
        existing_book = Book.objects.filter(isbn13=book_data['isbn13']).first()
        if existing_book:
            logger.info(f"Book with ISBN13 {book_data['isbn13']} already exists")
            return existing_book  # Return existing book instead of None to allow further processing
        
        
        
        # Create book with cleaned data
        book = Book(
            isbn13=book_data['isbn13'],
            isbn=book_data.get('isbn'),
            title=book_data['title'].strip(),  # Ensure title is stripped
            cover_img=book_data.get('cover_img'),
            description=book_data.get('description', '').strip(),  # Clean description
            number_of_pages=book_data.get('number_of_pages'),
            average_rate=0,  # Use average_rating from API
            publication_date=parse_date(book_data.get('publication_date')),
            source=book_data.get('source', 'openlibrary'),  # Use the source from the API
            language=book_data.get('language')  # Add language field
        )
        
        book.save()
        
        logger.info(f"Book saved: {book.title} (ISBN: {book.isbn13})")
        
        # Process authors
        authors_added = False
        if book_data.get('authors'):
            for author_data in book_data.get('authors', []):
                try:
                    # Initialize variables
                    author_name = None
                
                    existing_author = None
                    
                    # Handle both string author names and author dictionaries
                    if isinstance(author_data, str):
                        author_name = author_data.strip()
                        if not author_name:
                            continue
                    else:
                        # Extract author details from dictionary
                        author_name = author_data.get('name', '').strip()
                        if not author_name:
                            continue
                        
                        
                        
                    
                    # Normalize author name (Title Case)
                    author_name = ' '.join(word.capitalize() for word in author_name.split())
                    
                    # First try exact match
                    existing_author = Author.objects.filter(name__iexact=author_name).first()
                    
                    if not existing_author:
                        # Try to find similar authors
                        # Look for authors with similar names (containing the same words in any order)
                        name_words = set(author_name.lower().split())
                        similar_authors = Author.objects.annotate(
                            name_length=Length('name')
                        ).filter(
                            Q(name__icontains=author_name) |  # Contains the full name
                            Q(name__iregex=r'\b(' + '|'.join(name_words) + r')\b')  # Contains any of the words
                        ).order_by('-name_length')  # Prefer longer names (more specific)
                        
                        if similar_authors.exists():
                            # Use the most similar author (longest name match)
                            existing_author = similar_authors.first()
                            logger.info(f"Found similar author: '{existing_author.name}' for '{author_name}'")
                
                        
                    # Create new author with normalized data
                    author = Author.objects.create(
                            name=author_name,
                            number_of_books=0,  # Will be updated below
                    )
                    
                    # Check if book-author relationship already exists
                    if not BookAuthor.objects.filter(book=book, author=author).exists():
                        # Create book-author relationship
                        BookAuthor.objects.create(book=book, author=author)
                        # Update author's book count
                        author.number_of_books = BookAuthor.objects.filter(author=author).count()
                        author.save(update_fields=['number_of_books'])
                        authors_added = True
                        logger.debug(f"Added author '{author.name}' to book {book.isbn13}")
                    else:
                        logger.debug(f"Author '{author.name}' already associated with book {book.isbn13}")
                    
                except Exception as e:
                    logger.warning(f"Error adding author '{author_name if author_name else 'Unknown'}' to book: {e}")
                    # Continue with other authors even if one fails
        
        # If no authors were added, create a default author
        if not authors_added:
            try:
                # First try to find an existing default author
                default_author = Author.objects.filter(name="Unknown Author").first()
                
                if not default_author:
                    # If no default author exists, create one
                    default_author = Author.objects.create(
                        name="Unknown Author",
                        number_of_books=0,  # Will be updated below
                    )
                
                if not BookAuthor.objects.filter(book=book, author=default_author).exists():
                    BookAuthor.objects.create(book=book, author=default_author)
                    # Update default author's book count
                    default_author.number_of_books = BookAuthor.objects.filter(author=default_author).count()
                    default_author.save(update_fields=['number_of_books'])
                    logger.warning(f"No valid authors provided for book {book.isbn13}, using default author")
            except Exception as e:
                logger.error(f"Error handling default author: {e}")
                # Continue without default author if there's an error
        
        # Process genres
        genres_added = False
        if book_data.get('genres'):
            for genre_name in book_data.get('genres', []):
                try:
                    if genre_name and isinstance(genre_name, str):
                        # Normalize genre name (trim whitespace, capitalize first letter)
                        genre_name = genre_name.strip().title()
                        if not genre_name:
                            continue

                        # Get or create the primary genre
                        primary_genre, created = Genre.objects.get_or_create(
                            name__iexact=genre_name,
                            defaults={
                                'name': genre_name,
                                'description': f"Books in the {genre_name} category"
                            }
                        )

                        # Handle genre relationships and hierarchies
                        if created:
                            # For new genres, try to find related genres
                            related_genres = Genre.objects.filter(
                                name__icontains=genre_name
                            ).exclude(id=primary_genre.id)
                            
                            if related_genres.exists():
                                # If we found related genres, use the most specific one
                                # (the one with the longest name, as it's likely more specific)
                                most_specific = max(related_genres, key=lambda g: len(g.name))
                                if len(most_specific.name) > len(genre_name):
                                    # Use the more specific genre instead
                                    primary_genre = most_specific
                                    logger.info(f"Using more specific genre '{most_specific.name}' instead of '{genre_name}'")
                                else:
                                    # Update the new genre's description to reference related genres
                                    related_names = [g.name for g in related_genres]
                                    primary_genre.description = f"Books in the {genre_name} category. Related to: {', '.join(related_names)}"
                                    primary_genre.save()

                        # Check if book already has this genre
                        if not book.genres.filter(id=primary_genre.id).exists():  
                            try:
                                book.genres.add(primary_genre)                                
                                genres_added = True
                                logger.debug(f"Added genre '{primary_genre.name}' to book {book.isbn13}")
                            except Exception as e:
                                # Handle potential duplicate key error
                                if 'unique constraint' not in str(e).lower():
                                    raise
                                # If it's a duplicate, just continue
                                logger.debug(f"Genre '{primary_genre.name}' already exists for book {book.isbn13}")

                except Exception as e:
                    logger.warning(f"Error adding genre '{genre_name}' to book: {e}")
                    # Continue with other genres even if one fails

        # If no genres were added, add default genre
        if not genres_added:
            default_genre, _ = Genre.objects.get_or_create(
                name="Uncategorized",
                defaults={
                    'name': "Uncategorized",
                    'description': "Books that haven't been categorized yet"
                }
            )
            try:
                book.genres.add(default_genre)
                logger.warning(f"No valid genres provided for book {book.isbn13}, using default genre")
            except Exception as e:
                # Handle potential duplicate key error
                if 'unique constraint' not in str(e).lower():
                    logger.error(f"Error adding default genre to book: {e}")
        
        return book
    
    except Exception as e:
        logger.error(f"Error saving external book: {e}", exc_info=True)
        # Check for specific error types and provide more context
        if 'connection' in str(e).lower():
            logger.error("Network connection error while saving book - check internet connectivity")
        return None