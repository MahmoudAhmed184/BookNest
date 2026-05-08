from django.core.management.base import BaseCommand

from apps.books.models import Book
from apps.recommendations.models import CatalogRecommendation
from apps.recommendations.services import replace_catalog_recommendations


class Command(BaseCommand):
    help = "Refresh catalog recommendations from current book popularity signals."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=CatalogRecommendation.Source.TRENDING)
        parser.add_argument("--limit", type=int, default=50)

    def handle(self, *args, **options):
        source = options["source"]
        limit = options["limit"]
        books = Book.objects.visible().order_by("-trending_score", "-average_rating", "-rating_count")[:limit]
        ranked_books = [
            (book, rank, float(book.trending_score or book.popularity_score or 0))
            for rank, book in enumerate(books, 1)
        ]
        recommendations = replace_catalog_recommendations(source=source, ranked_books=ranked_books)
        self.stdout.write(self.style.SUCCESS(f"Refreshed {len(recommendations)} {source} catalog recommendations."))
