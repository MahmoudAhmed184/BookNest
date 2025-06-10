import requests
import json
import logging
import time
from typing import Dict, List, Any, Optional
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logger = logging.getLogger(__name__)

# Function to check network connectivity
def check_network_connectivity(test_url="https://www.google.com", timeout=3):
    """Check if network connection is available
    
    Args:
        test_url: URL to test connection with
        timeout: Connection timeout in seconds
        
    Returns:
        Boolean indicating if connection is available
    """
    try:
        requests.head(test_url, timeout=timeout)
        return True
    except requests.RequestException:
        return False

def get_requests_session():
    """Create a requests session with retry logic."""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(500, 502, 503, 504)
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def clean_isbn(isbn: Optional[str]) -> Optional[str]:
    """Clean and validate ISBN to ensure it's in the correct format.
    
    Args:
        isbn: ISBN string to clean
        
    Returns:
        Cleaned ISBN string or None if invalid
    """
    if not isbn:
        return None
        
    # Remove any non-alphanumeric characters
    isbn = ''.join(c for c in isbn if c.isalnum())
    
    # If it's an ISBN-13, ensure it's exactly 13 digits
    if len(isbn) == 13 and isbn.isdigit():
        return isbn
        
    # If it's an ISBN-10, ensure it's exactly 10 characters (digits or X)
    if len(isbn) == 10 and (isbn[:-1].isdigit() and (isbn[-1].isdigit() or isbn[-1].upper() == 'X')):
        return isbn
        
    return None

class OpenLibraryClient:
    """Client for interacting with the OpenLibrary API"""
    BASE_URL = "https://openlibrary.org/api"
    SEARCH_URL = "https://openlibrary.org/search.json"
    AUTHOR_URL = "https://openlibrary.org/authors/"
    
    # Fields we want to retrieve from OpenLibrary
    FIELDS = [
        "key", "title", "author_name", "isbn", "cover_i",
        "first_publish_year", "number_of_pages_median", "description",
        "subject", "language", "ratings_average"
    ]
    
    @classmethod
    def search_books(cls, query: str, page_size: int = 15) -> List[Dict[str, Any]]:
        """Search for books using OpenLibrary API
        
        Args:
            query: Search query string (can be ISBN-13, title, or author)
            page_size: Number of results to return (default: 15)
            
        Returns:
            List of book dictionaries
        """
        if not query or len(query.strip()) < 2:
            logger.warning("Query too short for OpenLibrary search")
            return []
            
        try:
            # Use session with retry logic and timeout
            session = get_requests_session()
            
            # If query looks like an ISBN-13, search specifically for it
            isbn13 = clean_isbn(query)
            if isbn13 and len(isbn13) == 13:
                response = session.get(
                    cls.SEARCH_URL,
                    params={
                        "q": f"isbn:{isbn13}",
                        "limit": page_size,
                        "fields": ",".join(cls.FIELDS)
                    },
                    timeout=(5, 10)
                )
            else:
                response = session.get(
                    cls.SEARCH_URL,
                    params={
                        "q": query,
                        "limit": page_size,
                        "fields": ",".join(cls.FIELDS)
                    },
                    timeout=(5, 10)
                )
            
            response.raise_for_status()
            data = response.json()
            
            books = []
            for doc in data.get("docs", []):
                # Get basic author information
                author_names = doc.get("author_name", [])
                authors = [{"name": name} for name in author_names]
                
                # Get cover image
                cover_img = None
                if doc.get("cover_i"):
                    cover_img = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
                
                # Clean ISBNs
                isbn = clean_isbn(doc.get("isbn", [None])[0])
                
                # Get all languages as comma-separated string
                languages = doc.get("language", [])
                language_str = ", ".join(lang for lang in languages if lang) if languages else None
                
                # Format book data
                book = {
                    "isbn13": isbn if isbn and len(isbn) == 13 else None,
                    "isbn": isbn if isbn and len(isbn) == 10 else None,
                    "title": doc.get("title", ""),
                    "authors": authors,
                    "cover_img": cover_img,
                    "publication_date": doc.get("first_publish_year"),
                    "number_of_pages": doc.get("number_of_pages_median"),
                    "description": doc.get("description", ""),
                    "genres": doc.get("subject", [])[:5],
                    "source": "openlibrary",
                    "language": language_str,
                    "average_rating": doc.get("ratings_average"),
                }
            if book["isbn13"]:
                books.append(book)
            
            return books
            
        except requests.RequestException as e:
            logger.error(f"Error searching OpenLibrary: {e}")
            return []

class GoogleBooksClient:
    """Client for interacting with the Google Books API"""
    BASE_URL = "https://www.googleapis.com/books/v1/volumes"
    MAX_RESULTS = 40  # Google Books API limit
    
    # Fields we want to retrieve from Google Books
    FIELDS = (
        "items(volumeInfo(title,authors,description,industryIdentifiers,"
        "pageCount,publishedDate,imageLinks/thumbnail,categories,language,"
        "averageRating))"
    )
    
    @classmethod
    def search_books(cls, query: str, page_size: int = 15) -> List[Dict[str, Any]]:
        """Search for books using Google Books API
        
        Args:
            query: Search query string (can be ISBN-13, title, or author)
            page_size: Number of results to return (default: 15)
            
        Returns:
            List of book dictionaries
        """
        if not query or len(query.strip()) < 2:
            logger.warning("Query too short for Google Books search")
            return []
            
        try:
            # Use session with retry logic and timeout
            session = get_requests_session()
            
            # If query looks like an ISBN-13, search specifically for it
            isbn13 = clean_isbn(query)
            if isbn13 and len(isbn13) == 13:
                response = session.get(
                    cls.BASE_URL,
                    params={
                        "q": f"isbn:{isbn13}",
                        "maxResults": min(page_size, cls.MAX_RESULTS),
                        "fields": cls.FIELDS
                    },
                    timeout=(5, 10)
                )
            else:
                response = session.get(
                    cls.BASE_URL,
                    params={
                        "q": query,
                        "maxResults": min(page_size, cls.MAX_RESULTS),
                        "fields": cls.FIELDS
                    },
                    timeout=(5, 10)
                )
            
            response.raise_for_status()
            data = response.json()
            
            books = []
            for item in data.get("items", []):
                volume_info = item.get("volumeInfo", {})
                
                # Extract and clean ISBNs
                industry_identifiers = volume_info.get("industryIdentifiers", [])
                isbn13 = clean_isbn(next((id_info.get("identifier") for id_info in industry_identifiers 
                              if id_info.get("type") == "ISBN_13"), None))
                isbn10 = clean_isbn(next((id_info.get("identifier") for id_info in industry_identifiers 
                              if id_info.get("type") == "ISBN_10"), None))
                
                # Get basic author information
                author_names = volume_info.get("authors", [])
                authors = [{"name": name} for name in author_names]
                
                # Get cover image
                cover_img = None
                if volume_info.get("imageLinks", {}).get("thumbnail"):
                    cover_img = volume_info["imageLinks"]["thumbnail"]
                
                # Get language as comma-separated string
                language = volume_info.get("language")
                language_str = language if language else None
                
                # Format book data with available fields
                book = {
                    "isbn13": isbn13,
                    "isbn": isbn10,
                    "title": volume_info.get("title", ""),
                    "authors": authors,
                    "cover_img": cover_img,
                    "publication_date": volume_info.get("publishedDate"),
                    "number_of_pages": volume_info.get("pageCount"),
                    "description": volume_info.get("description", ""),
                    "genres": volume_info.get("categories", [])[:5] if volume_info.get("categories") else [],
                    "source": "googlebooks",
                    "language": language_str,
                    "average_rating": volume_info.get("averageRating")
                }
                books.append(book)
            
            return books
            
        except requests.RequestException as e:
            logger.error(f"Error searching Google Books: {e}")
            return []

def evaluate_book_completeness(book: Dict[str, Any]) -> float:
    """
    Evaluate how complete a book's information is.
    Returns a score between 0 and 1, where 1 means all important fields are present.
    
    Args:
        book: Book dictionary from either API
        
    Returns:
        Completeness score (0-1)
    """
    # Define required and optional fields with their weights
    required_fields = {
        'title': 0.2,
        'authors': 0.2,
        'isbn13': 0.15,
        'description': 0.15,
        'cover_img': 0.1,
        'publication_date': 0.1,
        'genres': 0.1
    }
    
    optional_fields = {
        'number_of_pages': 0.05,
        'language': 0.05,
        'publisher': 0.05,
        'average_rating': 0.05,
        'ratings_count': 0.05
    }
    
    score = 0.0
    
    # Check required fields
    for field, weight in required_fields.items():
        if field in book and book[field]:
            if field == 'authors' and len(book[field]) > 0:
                score += weight
            elif field == 'genres' and len(book[field]) > 0:
                score += weight
            elif field != 'authors' and field != 'genres':
                score += weight
    
    # Check optional fields
    for field, weight in optional_fields.items():
        if field in book and book[field]:
            score += weight
    
    return score

def merge_book_results(openlibrary_books: List[Dict[str, Any]], 
                      googlebooks_books: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merge and deduplicate book results from both APIs, keeping the most complete information.
    
    Args:
        openlibrary_books: List of books from OpenLibrary
        googlebooks_books: List of books from GoogleBooks
        
    Returns:
        List of merged books with the most complete information
    """
    # Create a dictionary to store the best version of each book
    best_books = {}
    
    # Process OpenLibrary books
    for book in openlibrary_books:
        isbn13 = book.get('isbn13')
        if not isbn13:
            continue
            
        score = evaluate_book_completeness(book)
        if isbn13 not in best_books or score > best_books[isbn13]['score']:
            best_books[isbn13] = {
                'book': book,
                'score': score,
                'source': 'openlibrary'
            }
    
    # Process GoogleBooks books
    for book in googlebooks_books:
        isbn13 = book.get('isbn13')
        if not isbn13:
            continue
            
        score = evaluate_book_completeness(book)
        if isbn13 not in best_books or score > best_books[isbn13]['score']:
            best_books[isbn13] = {
                'book': book,
                'score': best_books[isbn13]['score'] if isbn13 in best_books else 0,
                'source': 'googlebooks'
            }
    
    # Merge information from both sources when available
    for isbn13, book_info in best_books.items():
        book = book_info['book']
        other_source = 'googlebooks' if book_info['source'] == 'openlibrary' else 'openlibrary'
        
        # Find the same book in the other source
        other_books = googlebooks_books if other_source == 'googlebooks' else openlibrary_books
        other_book = next((b for b in other_books if b.get('isbn13') == isbn13), None)
        
        if other_book:
            # Merge missing information
            for key, value in other_book.items():
                if key not in book or not book[key]:
                    book[key] = value
                elif key == 'authors' and len(book[key]) < len(value):
                    # Merge unique authors
                    existing_names = {a.get('name') for a in book[key]}
                    book[key].extend([a for a in value if a.get('name') not in existing_names])
                elif key == 'genres' and len(book[key]) < len(value):
                    # Merge unique genres
                    existing_genres = set(book[key])
                    book[key].extend([g for g in value if g not in existing_genres])
    
    # Return the merged books, sorted by completeness score
    return [info['book'] for info in sorted(best_books.values(), 
                                          key=lambda x: x['score'], 
                                          reverse=True)]

def search_external_apis(query: str, max_retries=2, timeout=10) -> List[Dict[str, Any]]:
    """Search for books across all external APIs with retry mechanism
    
    Args:
        query: Search query string
        max_retries: Maximum number of retries if all APIs fail
        timeout: Timeout in seconds for API requests (default: 10)
        
    Returns:
        Combined list of book dictionaries from all APIs with complete author information
    """
    # First check network connectivity
    if not check_network_connectivity():
        logger.error("Network connectivity issue detected. Cannot reach external APIs.")
        return []
        
    retry_count = 0
    openlibrary_results = []
    googlebooks_results = []
    
    while retry_count <= max_retries and not (openlibrary_results or googlebooks_results):
        if retry_count > 0:
            logger.info(f"Retry attempt {retry_count} for external API search")
            # Add exponential backoff between retries
            time.sleep(2 ** retry_count)
            
        # Search both APIs with custom timeout
        try:
            # Override the default timeout in the API clients
            session = get_requests_session()
            # Adjust the timeout for both connection and read operations
            conn_timeout = min(timeout/3, 5)  # Connection timeout (max 5 seconds)
            read_timeout = timeout - conn_timeout  # Remaining time for read
            
            # Pass custom timeout to API clients through their session objects
            with requests.Session() as custom_session:
                # Configure the session with retry logic
                retry = Retry(
                    total=max_retries,
                    read=max_retries,
                    connect=max_retries,
                    backoff_factor=0.5,
                    status_forcelist=(500, 502, 503, 504),
                )
                adapter = HTTPAdapter(max_retries=retry)
                custom_session.mount('http://', adapter)
                custom_session.mount('https://', adapter)
                
                # Use the session for both API clients
                openlibrary_results = OpenLibraryClient.search_books(query)
                googlebooks_results = GoogleBooksClient.search_books(query)
        except requests.Timeout:
            logger.error(f"Timeout error while searching external APIs (timeout={timeout}s)")
            return []
        except requests.ConnectionError:
            logger.error("Connection error while searching external APIs")
            return []
        
        retry_count += 1
        
        # If we got results from either API, no need to retry
        if openlibrary_results or googlebooks_results:
            break
    
    if not (openlibrary_results or googlebooks_results) and retry_count > max_retries:
        logger.warning(f"Failed to get results from external APIs after {max_retries} retries")
        return []
    
    # Merge and deduplicate results
    merged_results = merge_book_results(openlibrary_results, googlebooks_results)
    logger.info(f"Successfully merged {len(merged_results)} books from external APIs")
    
    return merged_results