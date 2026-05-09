from django.core.management.base import BaseCommand

from apps.books.models import Author, Book, Genre
from apps.books.services import sync_author_book_count, sync_book_denormalized_labels, sync_genre_book_count
from apps.collections.models import ReadingCollection
from apps.collections.services import sync_collection_item_count
from apps.reviews.services import sync_book_rating_stats, sync_book_review_count


class Command(BaseCommand):
    help = "Repair denormalized counters and search-display labels."

    def handle(self, *_args, **_options):
        for author in Author.objects.all():
            sync_author_book_count(author=author)
        for genre in Genre.objects.all():
            sync_genre_book_count(genre=genre)
        for book in Book.objects.all():
            sync_book_denormalized_labels(book=book)
            sync_book_rating_stats(book=book)
            sync_book_review_count(book=book)
        for collection in ReadingCollection.objects.all():
            sync_collection_item_count(collection=collection)
        self.stdout.write(self.style.SUCCESS("Repaired denormalized data."))
