from typing import Dict, Any, Optional, List
import requests
import logging
from datetime import datetime, timedelta
from urllib.parse import quote
import json
from functools import lru_cache
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from django.core.cache import cache
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from django.db.models import Count
from books.models import Book, Author

# Configure logging
logger = logging.getLogger(__name__)

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

class AuthorInfoService:
    """Service for fetching comprehensive author information from multiple sources."""
    
    # API endpoints
    WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"
    WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
    LIBRARY_OF_CONGRESS_API_URL = "https://id.loc.gov/authorities/names/suggest/"
    GOODREADS_API_URL = "https://www.goodreads.com/author/show.xml"
    
    # Cache settings
    CACHE_TIMEOUT = 60 * 60 * 24  # 24 hours
    CACHE_KEY_PREFIX = "author_info"
    
    @staticmethod
    def get_author_info(author_name: str) -> Dict[str, Any]:
        """
        Get essential author information (bio and birth date) and accurate book count.
        Uses caching and parallel processing for better performance.
        """
        if not author_name:
            return {}
            
        # Check cache first
        cache_key = f"{AuthorInfoService.CACHE_KEY_PREFIX}:{author_name.lower()}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Cache hit for author: {author_name}")
            return cached_data
            
        try:
            # Initialize results with default values
            results = {
                "name": author_name,
                "bio": "",
                "birth_date": None,
                "number_of_books": 0
            }
            
            # Get book count from database
            try:
                author = Author.objects.filter(name__iexact=author_name).first()
                if author:
                    results["number_of_books"] = Book.objects.filter(authors=author).count()
            except Exception as e:
                logger.error(f"Error getting book count for {author_name}: {e}")
            
            # Use ThreadPoolExecutor for parallel processing
            with ThreadPoolExecutor(max_workers=2) as executor:
                # Submit API calls for bio and birth date
                wikipedia_future = executor.submit(AuthorInfoService._get_wikipedia_info, author_name)
                wikidata_future = executor.submit(AuthorInfoService._get_wikidata_info, author_name)
                
                # Get results
                wikipedia_data = wikipedia_future.result()
                wikidata_data = wikidata_future.result()
            
            # Merge data from sources
            if wikipedia_data and wikipedia_data.get("bio"):
                results["bio"] = wikipedia_data["bio"]
            if wikidata_data and wikidata_data.get("birth_date"):
                results["birth_date"] = wikidata_data["birth_date"]
            
            # Cache the results if we got any meaningful data
            if results["bio"] or results["birth_date"]:
                cache.set(cache_key, results, AuthorInfoService.CACHE_TIMEOUT)
                logger.info(f"Cached author info for: {author_name}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching author info for {author_name}: {e}")
            return {}
    
    @staticmethod
    def _get_wikipedia_info(author_name: str) -> Dict[str, Any]:
        """Get author information from Wikipedia API"""
        try:
            # First, search for the author
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": author_name,
                "format": "json"
            }
            
            response = requests.get(AuthorInfoService.WIKIPEDIA_API_URL, params=search_params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            search_results = data.get("query", {}).get("search", [])
            
            if not search_results:
                return {}
            
            # Get the first result's page ID
            page_id = search_results[0].get("pageid")
            if not page_id:
                return {}
            
            # Get the page content
            content_params = {
                "action": "query",
                "prop": "extracts",
                "pageids": page_id,
                "exintro": 1,
                "explaintext": 1,
                "format": "json"
            }
            
            content_response = requests.get(AuthorInfoService.WIKIPEDIA_API_URL, params=content_params, timeout=5)
            content_response.raise_for_status()
            
            content_data = content_response.json()
            page = content_data.get("query", {}).get("pages", {}).get(str(page_id), {})
            
            if not page:
                return {}
            
            return {
                "bio": page.get("extract", "")
            }
            
        except Exception as e:
            logger.error(f"Error fetching Wikipedia data: {e}")
            return {}
    
    @staticmethod
    def _get_wikidata_info(author_name: str) -> Dict[str, Any]:
        """Get author information from Wikidata API"""
        try:
            # First, search for the author
            search_params = {
                "action": "wbsearchentities",
                "search": author_name,
                "language": "en",
                "type": "item",
                "format": "json"
            }
            
            response = requests.get(AuthorInfoService.WIKIDATA_API_URL, params=search_params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            search_results = data.get("search", [])
            
            if not search_results:
                return {}
            
            # Get the first result's ID
            entity_id = search_results[0].get("id")
            if not entity_id:
                return {}
            
            # Get the entity data
            entity_params = {
                "action": "wbgetentities",
                "ids": entity_id,
                "languages": "en",
                "format": "json"
            }
            
            entity_response = requests.get(AuthorInfoService.WIKIDATA_API_URL, params=entity_params, timeout=5)
            entity_response.raise_for_status()
            
            entity_data = entity_response.json()
            entity = entity_data.get("entities", {}).get(entity_id, {})
            
            if not entity:
                return {}
            
            # Extract relevant information
            claims = entity.get("claims", {})
            
            return {
                "birth_date": AuthorInfoService._get_claim_value(claims, "P569")
            }
            
        except Exception as e:
            logger.error(f"Error fetching Wikidata data: {e}")
            return {}
    
    @staticmethod
    def _get_claim_value(claims: Dict[str, Any], property_id: str) -> Optional[str]:
        """Extract a single value from Wikidata claims"""
        if property_id not in claims:
            return None
        claim = claims[property_id][0]
        return claim.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
    
    @staticmethod
    def _get_library_of_congress_info(author_name: str) -> Dict[str, Any]:
        """Get author information from Library of Congress API"""
        try:
            # Format author name for search
            search_name = author_name.replace(" ", "+")
            url = f"{AuthorInfoService.LIBRARY_OF_CONGRESS_API_URL}?q={search_name}&format=json"
            
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            
            # Parse the JSON response
            data = response.json()
            
            # The Library of Congress API returns a list of suggestions
            if not data or not isinstance(data, list):
                return {}
                
            # Find the best match
            best_match = None
            for item in data:
                if isinstance(item, dict) and item.get("label", "").lower() == author_name.lower():
                    best_match = item
                    break
            
            if not best_match:
                return {}
            
            # Extract relevant information
            return {
                "loc_id": best_match.get("uri", "").split("/")[-1] if best_match.get("uri") else None,
                "loc_uri": best_match.get("uri"),
                "loc_type": best_match.get("type"),
                "loc_authority": "Library of Congress"
            }
            
        except Exception as e:
            logger.error(f"Error fetching Library of Congress data: {e}")
            return {}
    
    @staticmethod
    def _get_goodreads_info(author_name: str) -> Dict[str, Any]:
        """Get author information from Goodreads API"""
        try:
            # First, search for the author
            search_url = f"{AuthorInfoService.GOODREADS_API_URL}?key={settings.GOODREADS_API_KEY}&name={quote(author_name)}"
            
            response = requests.get(search_url, timeout=5)
            response.raise_for_status()
            
            # Parse XML response
            text = response.text()
            if not text:
                return {}
            
            # Extract author ID from response
            author_id = None
            if "id" in text:
                try:
                    author_id = text.split("<id>")[1].split("</id>")[0]
                except:
                    pass
            
            if not author_id:
                return {}
            
            # Get detailed author information
            author_url = f"{AuthorInfoService.GOODREADS_API_URL}/{author_id}?key={settings.GOODREADS_API_KEY}"
            
            author_response = requests.get(author_url, timeout=5)
            author_response.raise_for_status()
            
            author_text = author_response.text()
            if not author_text:
                return {}
            
            # Extract information from XML
            try:
                return {
                    "goodreads_id": author_id,
                    "goodreads_url": f"https://www.goodreads.com/author/show/{author_id}",
                    "goodreads_rating": AuthorInfoService._extract_xml_value(author_text, "average_rating"),
                    "goodreads_rating_count": AuthorInfoService._extract_xml_value(author_text, "ratings_count"),
                    "goodreads_review_count": AuthorInfoService._extract_xml_value(author_text, "reviews_count"),
                    "goodreads_works_count": AuthorInfoService._extract_xml_value(author_text, "works_count"),
                    "number_of_books": AuthorInfoService._extract_xml_value(author_text, "works_count")
                }
            except:
                return {}
            
        except Exception as e:
            logger.error(f"Error fetching Goodreads data: {e}")
            return {}
    
    @staticmethod
    def _extract_xml_value(xml_text: str, tag: str) -> Optional[str]:
        """Extract a value from XML text"""
        try:
            return xml_text.split(f"<{tag}>")[1].split(f"</{tag}>")[0]
        except:
            return None 