from __future__ import annotations

import logging
from datetime import date
from typing import Any

import requests
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.books import services as book_services
from apps.books.models import Author, Book, BookAuthor, BookGenre, Genre
from apps.integrations.models import (
    BookExternalIdentifier,
    ExternalBookRecord,
    ExternalCatalogSource,
    ExternalEnrichmentRequest,
    ExternalSyncRun,
    ExternalSyncState,
)

logger = logging.getLogger(__name__)

DEFAULT_EXTERNAL_SOURCES = (
    {
        "provider": ExternalCatalogSource.Provider.OPENLIBRARY,
        "display_name": "OpenLibrary",
        "base_url": "https://openlibrary.org",
        "priority": 10,
    },
    {
        "provider": ExternalCatalogSource.Provider.GOOGLE_BOOKS,
        "display_name": "Google Books",
        "base_url": "https://www.googleapis.com/books/v1",
        "priority": 20,
    },
)


@transaction.atomic
def ensure_default_sources() -> list[ExternalCatalogSource]:
    sources = []
    for defaults in DEFAULT_EXTERNAL_SOURCES:
        provider = defaults["provider"]
        source, _created = ExternalCatalogSource.objects.update_or_create(provider=provider, defaults=defaults)
        ExternalSyncState.objects.get_or_create(source=source)
        sources.append(source)
    return sources


def _unique_slug(model, value: str, *, max_length: int) -> str:
    base = slugify(value)[:max_length] or "item"
    slug = base
    suffix = 2
    while model.objects.filter(slug=slug).exists():
        suffix_text = f"-{suffix}"
        slug = f"{base[: max_length - len(suffix_text)]}{suffix_text}"
        suffix += 1
    return slug


def _clean_isbn(value: Any, *, length: int) -> str:
    if not value:
        return ""
    cleaned = "".join(char for char in str(value).upper() if char.isdigit() or char == "X")
    return cleaned if len(cleaned) == length else ""


def _parse_year_date(value: Any) -> date | None:
    if not value:
        return None
    text = str(value).strip()
    if len(text) >= 10:
        try:
            return date.fromisoformat(text[:10])
        except ValueError:
            return None
    if len(text) >= 4 and text[:4].isdigit():
        return date(int(text[:4]), 1, 1)
    return None


def normalize_openlibrary_doc(doc: dict[str, Any]) -> dict[str, Any]:
    isbns = doc.get("isbn") or []
    isbn_13 = next((_clean_isbn(isbn, length=13) for isbn in isbns if _clean_isbn(isbn, length=13)), "")
    isbn_10 = next((_clean_isbn(isbn, length=10) for isbn in isbns if _clean_isbn(isbn, length=10)), "")
    cover_id = doc.get("cover_i")
    return {
        "external_id": doc.get("key") or isbn_13 or isbn_10 or doc.get("title", ""),
        "title": doc.get("title") or "",
        "subtitle": doc.get("subtitle") or "",
        "isbn_13": isbn_13,
        "isbn_10": isbn_10,
        "authors": [str(author).strip() for author in doc.get("author_name") or [] if str(author).strip()],
        "genres": [str(subject).strip() for subject in (doc.get("subject") or [])[:5] if str(subject).strip()],
        "publisher": ", ".join((doc.get("publisher") or [])[:2]),
        "publication_date": _parse_year_date(doc.get("first_publish_year")),
        "publication_year": doc.get("first_publish_year") if isinstance(doc.get("first_publish_year"), int) else None,
        "page_count": doc.get("number_of_pages_median"),
        "language": (doc.get("language") or [""])[0] if isinstance(doc.get("language"), list) else "",
        "cover_fallback_url": f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else "",
        "description": "",
        "source": Book.Source.OPENLIBRARY,
    }


def normalize_google_volume(item: dict[str, Any]) -> dict[str, Any]:
    info = item.get("volumeInfo") or {}
    identifiers = info.get("industryIdentifiers") or []
    isbn_13 = ""
    isbn_10 = ""
    for identifier in identifiers:
        value = identifier.get("identifier")
        if identifier.get("type") == "ISBN_13":
            isbn_13 = _clean_isbn(value, length=13)
        elif identifier.get("type") == "ISBN_10":
            isbn_10 = _clean_isbn(value, length=10)
    image_links = info.get("imageLinks") or {}
    return {
        "external_id": item.get("id") or isbn_13 or isbn_10 or info.get("title", ""),
        "title": info.get("title") or "",
        "subtitle": info.get("subtitle") or "",
        "isbn_13": isbn_13,
        "isbn_10": isbn_10,
        "authors": [str(author).strip() for author in info.get("authors") or [] if str(author).strip()],
        "genres": [str(category).strip() for category in info.get("categories") or [] if str(category).strip()],
        "publisher": info.get("publisher") or "",
        "publication_date": _parse_year_date(info.get("publishedDate")),
        "publication_year": (
            int(info["publishedDate"][:4])
            if str(info.get("publishedDate", ""))[:4].isdigit()
            else None
        ),
        "page_count": info.get("pageCount"),
        "language": info.get("language") or "",
        "cover_fallback_url": image_links.get("thumbnail") or image_links.get("smallThumbnail") or "",
        "description": info.get("description") or "",
        "source": Book.Source.GOOGLE_BOOKS,
    }


def search_external_source(*, source: ExternalCatalogSource, query: str, limit: int = 20) -> list[dict[str, Any]]:
    limit = min(max(int(limit), 1), 40)
    timeout = 8
    if source.provider == ExternalCatalogSource.Provider.OPENLIBRARY:
        params: dict[str, str | int] = {"q": query, "limit": limit}
        response = requests.get(
            f"{source.base_url.rstrip('/')}/search.json",
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
        return [
            normalize_openlibrary_doc(doc)
            for doc in response.json().get("docs", [])
            if doc.get("title")
        ]

    if source.provider == ExternalCatalogSource.Provider.GOOGLE_BOOKS:
        params = {"q": query, "maxResults": min(limit, 40)}
        response = requests.get(
            f"{source.base_url.rstrip('/')}/volumes",
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
        return [
            normalize_google_volume(item)
            for item in response.json().get("items", [])
            if (item.get("volumeInfo") or {}).get("title")
        ]

    return []


@transaction.atomic
def upsert_external_record(
    *,
    source: ExternalCatalogSource,
    normalized: dict[str, Any],
    raw_payload: dict[str, Any] | None = None,
) -> ExternalBookRecord:
    record, _created = ExternalBookRecord.objects.update_or_create(
        source=source,
        external_id=str(normalized["external_id"])[:255],
        defaults={
            "isbn_13": normalized.get("isbn_13", ""),
            "isbn_10": normalized.get("isbn_10", ""),
            "title": normalized.get("title", "")[:500],
            "subtitle": normalized.get("subtitle", "")[:500],
            "author_names": ", ".join(normalized.get("authors") or []),
            "raw_payload": raw_payload or normalized,
            "normalized_payload": normalized,
            "fetched_at": timezone.now(),
        },
    )
    return record


def _get_or_create_author(name: str) -> Author:
    normalized_name = book_services.normalize_label(name)
    author = Author.objects.filter(normalized_name=normalized_name).first()
    if author:
        return author
    return Author.objects.create(
        name=name,
        normalized_name=normalized_name,
        slug=_unique_slug(Author, name, max_length=255),
        source=Author.Source.IMPORT,
    )


def _get_or_create_genre(name: str) -> Genre:
    normalized_name = book_services.normalize_label(name)
    genre = Genre.objects.filter(normalized_name=normalized_name).first()
    if genre:
        return genre
    return Genre.objects.create(
        name=name[:120],
        normalized_name=normalized_name[:120],
        slug=_unique_slug(Genre, name, max_length=140),
    )


@transaction.atomic
def merge_external_record_into_book(*, record: ExternalBookRecord) -> tuple[Book, bool]:
    payload = record.normalized_payload or {}
    book = None
    if payload.get("isbn_13"):
        book = Book.objects.filter(isbn_13=payload["isbn_13"]).first()
    if book is None and payload.get("isbn_10"):
        book = Book.objects.filter(isbn_10=payload["isbn_10"]).first()

    created = False
    if book is None:
        book = Book.objects.create(
            title=payload.get("title") or record.title,
            subtitle=payload.get("subtitle", ""),
            slug=_unique_slug(Book, payload.get("title") or record.title, max_length=520),
            description=payload.get("description", ""),
            isbn_13=payload.get("isbn_13") or None,
            isbn_10=payload.get("isbn_10") or None,
            publisher=payload.get("publisher", ""),
            publication_date=payload.get("publication_date"),
            publication_year=payload.get("publication_year"),
            page_count=payload.get("page_count"),
            language=payload.get("language", ""),
            cover_fallback_url=payload.get("cover_fallback_url", ""),
            source=payload.get("source", Book.Source.IMPORT),
            external_last_synced_at=timezone.now(),
        )
        created = True
    else:
        update_fields = ["external_last_synced_at", "updated_at"]
        for field in (
            "subtitle",
            "description",
            "publisher",
            "publication_date",
            "publication_year",
            "page_count",
            "language",
            "cover_fallback_url",
        ):
            value = payload.get(field)
            if value and not getattr(book, field):
                setattr(book, field, value)
                update_fields.append(field)
        book.external_last_synced_at = timezone.now()
        book.save(update_fields=update_fields)

    author_ids = []
    for author_name in (payload.get("authors") or [])[:8]:
        author = _get_or_create_author(author_name)
        author_ids.append(author.id)
    if author_ids:
        book_services.set_book_authors(book=book, author_ids=author_ids)
        for position, author_id in enumerate(author_ids):
            BookAuthor.objects.filter(book=book, author_id=author_id).update(position=position)

    genre_ids = []
    for genre_name in (payload.get("genres") or [])[:8]:
        genre = _get_or_create_genre(genre_name)
        genre_ids.append(genre.id)
    if genre_ids:
        book_services.set_book_genres(book=book, genre_ids=genre_ids)
        for position, genre_id in enumerate(genre_ids):
            BookGenre.objects.filter(book=book, genre_id=genre_id).update(position=position, is_primary=position == 0)

    BookExternalIdentifier.objects.update_or_create(
        source=record.source,
        identifier_type=BookExternalIdentifier.IdentifierType.VOLUME,
        external_id=record.external_id,
        defaults={"book": book},
    )
    record.matched_book = book
    record.merge_status = ExternalBookRecord.MergeStatus.MERGED
    record.confidence = 1 if payload.get("isbn_13") or payload.get("isbn_10") else 0.75
    record.save(update_fields=["matched_book", "merge_status", "confidence", "updated_at"])
    return book, created


@transaction.atomic
def create_external_enrichment_request(
    *,
    query: str,
    requested_by: Any | None = None,
    priority: int = 5,
) -> ExternalEnrichmentRequest:
    existing = ExternalEnrichmentRequest.objects.filter(
        query=query,
        status__in=[
            ExternalEnrichmentRequest.Status.QUEUED,
            ExternalEnrichmentRequest.Status.RUNNING,
        ],
    ).first()
    if existing:
        return existing
    return ExternalEnrichmentRequest.objects.create(
        query=query,
        requested_by=requested_by,
        priority=priority,
        status=ExternalEnrichmentRequest.Status.QUEUED,
    )


def search_and_merge_external_books(*, query: str, limit: int = 20) -> dict[str, int]:
    stats = {"books_seen": 0, "books_created": 0, "books_updated": 0, "books_merged": 0}
    for source in ensure_default_sources():
        if not source.is_active:
            continue
        try:
            normalized_books = search_external_source(source=source, query=query, limit=limit)
        except requests.RequestException as exc:
            logger.warning("External search failed for %s query '%s': %s", source.provider, query, exc)
            continue

        for normalized in normalized_books:
            if not normalized.get("external_id") or not normalized.get("title"):
                continue
            stats["books_seen"] += 1
            record = upsert_external_record(source=source, normalized=normalized)
            _book, created = merge_external_record_into_book(record=record)
            stats["books_merged"] += 1
            if created:
                stats["books_created"] += 1
            else:
                stats["books_updated"] += 1

        source.last_sync_at = timezone.now()
        source.save(update_fields=["last_sync_at", "updated_at"])
        ExternalSyncState.objects.update_or_create(
            source=source,
            defaults={
                "last_success_at": timezone.now(),
                "last_error_message": "",
                "total_records_seen": stats["books_seen"],
                "total_records_saved": stats["books_merged"],
            },
        )

    return stats


@transaction.atomic
def start_sync_run(*, source: ExternalCatalogSource, query: str = "") -> ExternalSyncRun:
    return ExternalSyncRun.objects.create(
        source=source,
        sync_type=ExternalSyncRun.SyncType.QUERY if query else ExternalSyncRun.SyncType.INCREMENTAL,
        status=ExternalSyncRun.Status.RUNNING,
        query=query,
        started_at=timezone.now(),
    )
