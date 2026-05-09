from django.core.management.base import BaseCommand, CommandError

from apps.recommendations import services
from apps.recommendations.models import RecommendationModel


class Command(BaseCommand):
    help = "Train and activate a recommendation model from current rating data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--model-type",
            default=RecommendationModel.ModelType.HYBRID,
            choices=[choice[0] for choice in RecommendationModel.ModelType.choices],
        )
        parser.add_argument("--min-ratings", type=int, default=services.DEFAULT_MIN_RATINGS_FOR_RECOMMENDATIONS)
        parser.add_argument("--version", default=None)

    def handle(self, *_args, **options):
        model = services.train_recommendation_model(
            model_type=options["model_type"],
            min_ratings_per_user=options["min_ratings"],
            version=options["version"],
        )
        if model is None:
            raise CommandError("No recommendation model was trained. Check that enough ratings exist.")
        self.stdout.write(
            self.style.SUCCESS(
                f"Trained recommendation model {model.id} ({model.model_type}, version {model.version})."
            )
        )
