from django.core.management.base import BaseCommand

from apps.search.services import rebuild_autocomplete_terms, rebuild_book_search_labels


class Command(BaseCommand):
    help = "Rebuild denormalized book search labels and autocomplete terms."

    def handle(self, *args, **options):
        book_documents = rebuild_book_search_labels()
        autocomplete_terms = rebuild_autocomplete_terms()
        self.stdout.write(
            self.style.SUCCESS(
                f"Rebuilt {book_documents} book search documents and {autocomplete_terms} autocomplete terms."
            )
        )
