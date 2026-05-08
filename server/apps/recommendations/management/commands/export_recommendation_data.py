import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.recommendations.models import UserRecommendation
from apps.reviews.models import Rating


class Command(BaseCommand):
    help = "Export recommendation training and generated recommendation data as CSV files."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", default="exports/recommendations")

    def handle(self, *args, **options):
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        ratings_path = output_dir / "ratings.csv"
        with ratings_path.open("w", newline="", encoding="utf-8") as ratings_file:
            writer = csv.writer(ratings_file)
            writer.writerow(["user_id", "book_id", "rating", "rated_at"])
            for rating in Rating.objects.filter(is_archived=False).iterator():
                writer.writerow([rating.user_id, rating.book_id, rating.value, rating.rated_at.isoformat()])

        recommendations_path = output_dir / "user_recommendations.csv"
        with recommendations_path.open("w", newline="", encoding="utf-8") as recommendations_file:
            writer = csv.writer(recommendations_file)
            writer.writerow(["user_id", "book_id", "model_id", "rank", "score", "source", "generated_at"])
            for recommendation in UserRecommendation.objects.filter(is_active=True).iterator():
                writer.writerow(
                    [
                        recommendation.user_id,
                        recommendation.book_id,
                        recommendation.model_id,
                        recommendation.rank,
                        recommendation.score,
                        recommendation.source,
                        recommendation.generated_at.isoformat(),
                    ]
                )

        self.stdout.write(
            self.style.SUCCESS(f"Exported recommendation data to {ratings_path} and {recommendations_path}.")
        )
