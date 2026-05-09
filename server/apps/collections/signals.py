from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.collections.models import CollectionBook, ReadingProgress
from apps.collections.services import sync_book_collection_count, sync_collection_item_count


@receiver(post_save, sender=CollectionBook)
@receiver(post_delete, sender=CollectionBook)
def sync_collection_book_counters(sender, instance: CollectionBook, **_kwargs) -> None:
    del sender
    sync_collection_item_count(collection=instance.collection)
    sync_book_collection_count(book=instance.book)


@receiver(post_save, sender=ReadingProgress)
@receiver(post_delete, sender=ReadingProgress)
def sync_progress_counters(sender, instance: ReadingProgress, **_kwargs) -> None:
    del sender
    sync_book_collection_count(book=instance.book)
