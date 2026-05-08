from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.books.models import Author, AuthorLike, Book, BookAuthor, BookGenre, Genre
from apps.books.services import (
    sync_author_book_count,
    sync_author_like_count,
    sync_book_denormalized_labels,
    sync_genre_book_count,
)


def _sync_book_after_commit(book_id: int | None) -> None:
    if book_id is None:
        return

    def sync() -> None:
        book = Book.objects.filter(pk=book_id).first()
        if book is not None:
            sync_book_denormalized_labels(book=book)

    transaction.on_commit(sync)


@receiver(post_save, sender=BookAuthor)
@receiver(post_delete, sender=BookAuthor)
def sync_after_author_link_change(sender, instance: BookAuthor, **kwargs) -> None:
    _sync_book_after_commit(instance.book_id)
    transaction.on_commit(lambda: sync_author_book_count(author=instance.author))


@receiver(post_save, sender=BookGenre)
@receiver(post_delete, sender=BookGenre)
def sync_after_genre_link_change(sender, instance: BookGenre, **kwargs) -> None:
    _sync_book_after_commit(instance.book_id)
    transaction.on_commit(lambda: sync_genre_book_count(genre=instance.genre))


@receiver(post_save, sender=Author)
def sync_after_author_save(sender, instance: Author, **kwargs) -> None:
    for book in instance.books.all():
        transaction.on_commit(lambda book=book: sync_book_denormalized_labels(book=book))


@receiver(post_save, sender=Genre)
def sync_after_genre_save(sender, instance: Genre, **kwargs) -> None:
    for book in instance.books.all():
        transaction.on_commit(lambda book=book: sync_book_denormalized_labels(book=book))


@receiver(post_save, sender=AuthorLike)
@receiver(post_delete, sender=AuthorLike)
def sync_author_likes(sender, instance: AuthorLike, **kwargs) -> None:
    transaction.on_commit(lambda: sync_author_like_count(author=instance.author))
