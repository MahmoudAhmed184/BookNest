from django.db import transaction
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from apps.books.models import Author, Book, BookAuthor, Genre
from apps.books.utils.search_index import sync_book_search_index


def _sync_after_commit(book_id):
    if not book_id:
        return

    transaction.on_commit(lambda: sync_book_search_index(book_id))


@receiver(post_save, sender=Book)
def sync_book_after_save(sender, instance, **kwargs):
    _sync_after_commit(instance.pk)


@receiver(post_save, sender=BookAuthor)
@receiver(post_delete, sender=BookAuthor)
def sync_book_after_author_link_change(sender, instance, **kwargs):
    _sync_after_commit(instance.book_id)


@receiver(m2m_changed, sender=Book.genres.through)
def sync_book_after_genre_link_change(sender, instance, action, reverse, pk_set, **kwargs):
    if action not in {'post_add', 'post_remove', 'post_clear'}:
        return

    if reverse:
        book_ids = list(instance.books.values_list('isbn13', flat=True))
        for book_id in book_ids:
            _sync_after_commit(book_id)
        return

    _sync_after_commit(instance.pk)


@receiver(post_save, sender=Author)
def sync_books_after_author_save(sender, instance, **kwargs):
    book_ids = list(instance.books.values_list('isbn13', flat=True))
    for book_id in book_ids:
        _sync_after_commit(book_id)


@receiver(post_save, sender=Genre)
def sync_books_after_genre_save(sender, instance, **kwargs):
    book_ids = list(instance.books.values_list('isbn13', flat=True))
    for book_id in book_ids:
        _sync_after_commit(book_id)
