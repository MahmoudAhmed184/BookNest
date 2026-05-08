from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import transaction
from django.utils import timezone

from apps.collections.models import (
    CollectionBook,
    CollectionPrivacy,
    ReadingCollection,
    ReadingListType,
    ReadingProgress,
)

if TYPE_CHECKING:
    from apps.books.models import Book

DEFAULT_COLLECTIONS = (
    (ReadingListType.TODO, "To read"),
    (ReadingListType.DOING, "Reading"),
    (ReadingListType.DONE, "Read"),
)


def _slug_for_default(list_type: str) -> str:
    return list_type


@transaction.atomic
def create_default_collections_for_user(*, user: Any) -> list[ReadingCollection]:
    collections = []
    for list_type, name in DEFAULT_COLLECTIONS:
        collection, _created = ReadingCollection.objects.get_or_create(
            owner=user,
            slug=_slug_for_default(list_type),
            defaults={
                "name": name,
                "list_type": list_type,
                "privacy": CollectionPrivacy.PRIVATE,
                "is_default": True,
            },
        )
        collections.append(collection)
    return collections


def sync_collection_item_count(*, collection: ReadingCollection) -> ReadingCollection:
    collection.item_count = collection.items.filter(is_archived=False).count()
    collection.last_book_added_at = (
        collection.items.filter(is_archived=False).order_by("-added_at").values_list("added_at", flat=True).first()
    )
    collection.save(update_fields=["item_count", "last_book_added_at", "updated_at"])
    return collection


def sync_book_collection_count(*, book: Book) -> Book:
    book.collection_count = book.collection_items.filter(is_archived=False).count()
    book.read_count = book.reading_progress.filter(is_archived=False, status=ReadingListType.DONE).count()
    book.save(update_fields=["collection_count", "read_count", "updated_at"])
    return book


@transaction.atomic
def add_book_to_collection(
    *,
    collection: ReadingCollection,
    book: Book,
    added_by: Any | None = None,
    status: str = ReadingListType.TODO,
    notes: str = "",
) -> CollectionBook:
    item, created = CollectionBook.objects.get_or_create(
        collection=collection,
        book=book,
        defaults={"added_by": added_by, "status": status, "notes": notes},
    )
    if not created and item.is_archived:
        item.is_archived = False
        item.archived_at = None
        item.archive_reason = ""
        item.added_at = timezone.now()
        item.added_by = added_by
        item.status = status
        item.notes = notes
        item.save()
    sync_collection_item_count(collection=collection)
    sync_book_collection_count(book=book)
    return item


@transaction.atomic
def remove_book_from_collection(*, item: CollectionBook, reason: str = "removed") -> CollectionBook:
    item.archive(reason=reason)
    sync_collection_item_count(collection=item.collection)
    sync_book_collection_count(book=item.book)
    return item


@transaction.atomic
def update_reading_progress(*, user: Any, book: Book, **values: Any) -> ReadingProgress:
    progress, _created = ReadingProgress.objects.update_or_create(user=user, book=book, defaults=values)
    sync_book_collection_count(book=book)
    return progress
