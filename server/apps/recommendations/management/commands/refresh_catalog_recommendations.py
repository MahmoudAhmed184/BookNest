from django.core.management.base import BaseCommand

from apps.recommendations.models import CatalogRecommendation
from apps.recommendations.services import refresh_catalog_recommendations


class Command(BaseCommand):
    help = "Refresh catalog recommendations from current book popularity signals."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=CatalogRecommendation.Source.TRENDING)
        parser.add_argument("--limit", type=int, default=50)

    def handle(self, *_args, **options):
        source = options["source"]
        limit = options["limit"]
        recommendations = refresh_catalog_recommendations(source=source, limit=limit)
        self.stdout.write(self.style.SUCCESS(f"Refreshed {len(recommendations)} {source} catalog recommendations."))
