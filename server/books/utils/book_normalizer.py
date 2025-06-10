from typing import Dict, List, Any, Optional
import logging
from datetime import date
import re
from dateutil.parser import parse

# Import the centralized logger
from books.logging_config import logger

class BookNormalizer:
    """
    A centralized class for normalizing book data from various sources.
    Handles data cleaning, standardization, and filling in missing fields.
    """
    
    # Default values for missing fields
    DEFAULT_AUTHOR = "Unknown Author"
    DEFAULT_GENRE = "General"
    DEFAULT_COVER = "https://bookcover-placeholder.com/default-cover.jpg"  # Replace with actual default cover URL
    
    @classmethod
    def normalize(cls, book_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """
        Normalize book data from any source into a standardized format.
        
        Args:
            book_data: Raw book data from Google Books, OpenLibrary, or local database
            source: Source of the book data (e.g., 'googlebooks', 'openlibrary', 'database')
            
        Returns:
            Dictionary with normalized book data
        """
        # Create a new dictionary for normalized data
        normalized = {}
        
        # Normalize ISBN
        normalized["isbn13"] = cls._normalize_isbn13(book_data.get("isbn13"))
        normalized["isbn"] = cls._normalize_isbn(book_data.get("isbn"))
        
        # Normalize title (required field)
        normalized["title"] = cls._normalize_title(book_data.get("title", ""))
        
        # Normalize authors
        normalized["authors"] = cls._normalize_authors(book_data.get("authors", []))
        
        # Normalize genres
        normalized["genres"] = cls._normalize_genres(book_data.get("genres", []))
        
        # Normalize cover image URL
        normalized["cover_img"] = cls._normalize_cover_url(book_data.get("cover_img"))
        
        # Normalize publication date
        normalized["publication_date"] = cls._normalize_publication_date(book_data.get("publication_date"))
        
        # Normalize description
        normalized["description"] = cls._normalize_description(book_data.get("description", ""))
        
        # Normalize number of pages
        normalized["number_of_pages"] = cls._normalize_number_of_pages(book_data.get("number_of_pages"))
        
        # Add source information
        normalized["source"] = source
        
        # Log the normalized book
        author_names = ", ".join([author["name"] if isinstance(author, dict) else author 
                               for author in normalized["authors"]]) or cls.DEFAULT_AUTHOR
        genre_names = ", ".join(normalized["genres"]) or cls.DEFAULT_GENRE
        
        logger.info(f"Normalized Book: '{normalized['title']}' by {author_names} from {source} with genres: {genre_names}")
        
        return normalized
    
    @classmethod
    def _normalize_isbn13(cls, isbn13) -> Optional[str]:
        """Normalize ISBN-13 value"""
        if not isbn13:
            return None
            
        # If it's a list, take the first one
        if isinstance(isbn13, list) and isbn13:
            isbn13 = isbn13[0]
            
        # Convert to string and remove any non-digit characters
        isbn13_str = str(isbn13)
        isbn13_clean = re.sub(r'\D', '', isbn13_str)
        
        # Validate length
        if len(isbn13_clean) == 13:
            return isbn13_clean
        return None
    
    @classmethod
    def _normalize_isbn(cls, isbn) -> Optional[str]:
        """Normalize ISBN-10 value"""
        if not isbn:
            return None
            
        # If it's a list, take the first one
        if isinstance(isbn, list) and isbn:
            isbn = isbn[0]
            
        # Convert to string and remove any non-digit or 'X' characters
        isbn_str = str(isbn)
        isbn_clean = re.sub(r'[^0-9X]', '', isbn_str)
        
        # Validate length
        if len(isbn_clean) == 10:
            return isbn_clean
        return None
    
    @classmethod
    def _normalize_title(cls, title) -> str:
        """Normalize book title"""
        if not title:
            return "Untitled Book"
            
        # Strip whitespace and limit length
        return title.strip()[:255]
    
    @classmethod
    def _normalize_authors(cls, authors) -> List[Dict[str, Any]]:
        """Normalize author information"""
        normalized_authors = []
        
        if not authors or (isinstance(authors, list) and len(authors) == 0):
            # Return default author if none provided
            return [{
                "name": cls.DEFAULT_AUTHOR,
                "bio": "",
                "birth_date": None,
                "number_of_books": 1,
                "data_quality": "minimal"
            }]
        
        for author in authors:
            if isinstance(author, str):
                # Clean the author name
                author_name = author.strip()
                if not author_name:
                    author_name = cls.DEFAULT_AUTHOR
                else:
                    # Normalize capitalization (Title Case for names)
                    author_name = ' '.join(word.capitalize() for word in author_name.split())
                
                # Convert string author to dictionary
                normalized_authors.append({
                    "name": author_name,
                    "bio": "",
                    "birth_date": None,
                    "number_of_books": 1,
                    "data_quality": "minimal"
                })
            elif isinstance(author, dict):
                # Clean the author name
                author_name = author.get("name", "").strip()
                if not author_name:
                    author_name = cls.DEFAULT_AUTHOR
                else:
                    # Normalize capitalization (Title Case for names)
                    author_name = ' '.join(word.capitalize() for word in author_name.split())
                
                # Determine data quality based on available information
                data_quality = "minimal"
                if author.get("bio") and author.get("birth_date"):
                    data_quality = "complete"
                elif author.get("bio") or author.get("birth_date"):
                    data_quality = "partial"
                
                # Ensure all required fields exist
                normalized_authors.append({
                    "name": author_name,
                    "bio": author.get("bio", ""),
                    "birth_date": author.get("birth_date"),
                    "number_of_books": author.get("number_of_books", 1),
                    "data_quality": data_quality
                })
        
        return normalized_authors
    
    @classmethod
    def _normalize_genres(cls, genres) -> List[str]:
        """Normalize genre information"""
        normalized_genres = set()  # Use a set to prevent duplicates
        
        if not genres or (isinstance(genres, list) and len(genres) == 0):
            # Return default genre if none provided
            return [cls.DEFAULT_GENRE]
        
        for genre in genres:
            if genre and isinstance(genre, str):
                # Clean genre name
                clean_genre = genre.strip()
                if clean_genre:
                    # Capitalize first letter of each word
                    normalized_genre = clean_genre.title()
                    
                    # Handle common genre variations and abbreviations
                    genre_mapping = {
                        "Sci-Fi": "Science Fiction",
                        "Scifi": "Science Fiction",
                        "SF": "Science Fiction",
                        "Sci Fi": "Science Fiction",
                        "YA": "Young Adult",
                        "Historical": "Historical Fiction",
                        "Hist Fic": "Historical Fiction",
                        "Hist-Fic": "Historical Fiction",
                        "Histfic": "Historical Fiction",
                        "Lit": "Literature",
                        "Classic Lit": "Classic Literature",
                        "Classics": "Classic Literature",
                        "Contemp": "Contemporary",
                        "Contemp Fic": "Contemporary Fiction",
                        "Contemp Fiction": "Contemporary Fiction",
                        "Nonfic": "Non-Fiction",
                        "Non Fic": "Non-Fiction",
                        "Non Fiction": "Non-Fiction",
                    }
                    
                    # Apply mapping if genre is in the dictionary
                    if normalized_genre in genre_mapping:
                        normalized_genre = genre_mapping[normalized_genre]
                    
                    normalized_genres.add(normalized_genre)
        
        # If all genres were invalid, use default
        if not normalized_genres:
            return [cls.DEFAULT_GENRE]
        
        # Convert set back to list for return
        return list(normalized_genres)
    
    @classmethod
    def _normalize_cover_url(cls, cover_url) -> str:
        """Normalize cover image URL"""
        if not cover_url:
            return cls.DEFAULT_COVER
            
        # Return the URL as is, assuming it's valid
        # In a production environment, you might want to validate the URL
        return cover_url
    
    @classmethod
    def _normalize_publication_date(cls, pub_date) -> Optional[date]:
        """Normalize publication date"""
        if not pub_date:
            return None
            
        try:
            # Handle integer year
            if isinstance(pub_date, int):
                return date(pub_date, 1, 1)  # Default to January 1st
                
            # Handle string date in various formats
            if isinstance(pub_date, str):
                try:
                    # Try to parse the date string
                    return parse(pub_date).date()
                except (ValueError, TypeError):
                    # If parsing fails, try to extract just the year
                    year_match = re.search(r'\d{4}', pub_date)
                    if year_match:
                        return date(int(year_match.group()), 1, 1)
            
            # If it's already a date object, return it
            if isinstance(pub_date, date):
                return pub_date
                
        except Exception as e:
            logger.warning(f"Error processing publication date: {e}")
            
        return None
    
    @classmethod
    def _normalize_description(cls, description) -> str:
        """Normalize book description"""
        if not description:
            return ""
            
        # Strip whitespace and limit length if needed
        return description.strip()
    
    @classmethod
    def _normalize_number_of_pages(cls, pages) -> Optional[int]:
        """Normalize number of pages"""
        if not pages:
            return None
            
        try:
            # Convert to integer
            pages_int = int(pages)
            if pages_int > 0:
                return pages_int
        except (ValueError, TypeError):
            pass
            
        return None