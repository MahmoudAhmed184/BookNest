from django.core.management.base import BaseCommand

from apps.books.utils.search_index import rebuild_book_search_index


class Command(BaseCommand):
    help = "Rebuild denormalized book search documents."

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="Number of books to process per iterator batch.",
        )

    def handle(self, *args, **options):
        count = rebuild_book_search_index(batch_size=options["batch_size"])
        self.stdout.write(self.style.SUCCESS(f"Rebuilt {count} book search documents."))
