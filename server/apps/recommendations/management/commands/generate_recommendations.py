from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.recommendations import services


class Command(BaseCommand):
    help = "Generate personalized or fallback book recommendations."

    def add_arguments(self, parser):
        parser.add_argument("--user-id", type=int, help="Generate recommendations for one user.")
        parser.add_argument("--all", action="store_true", help="Generate recommendations for all eligible users.")
        parser.add_argument("--model-id", type=int, help="Recommendation model id to use.")
        parser.add_argument("--count", type=int, default=10, help="Recommendations to generate per user.")
        parser.add_argument(
            "--min-ratings",
            type=int,
            default=3,
            help="Minimum ratings required for batch generation.",
        )
        parser.add_argument(
            "--no-train",
            action="store_true",
            help="Do not train a model when no active artifact is available; use fallback candidates.",
        )

    def handle(self, *args, **options):
        user_id = options["user_id"]
        generate_all = options["all"]
        if bool(user_id) == bool(generate_all):
            raise CommandError("Specify exactly one of --user-id or --all.")

        if user_id:
            user = get_user_model().objects.get(pk=user_id)
            recommendations = services.generate_recommendations_for_user(
                user=user,
                n_recommendations=options["count"],
                model_id=options["model_id"],
                train_if_missing=not options["no_train"],
                min_ratings_per_user=options["min_ratings"],
            )
            self.stdout.write(
                self.style.SUCCESS(f"Generated {len(recommendations)} recommendations for user {user.pk}.")
            )
            return

        count = services.generate_recommendations_for_all_users(
            n_recommendations=options["count"],
            model_id=options["model_id"],
            min_ratings=options["min_ratings"],
            train_if_missing=not options["no_train"],
        )
        self.stdout.write(self.style.SUCCESS(f"Generated {count} recommendations for eligible users."))
