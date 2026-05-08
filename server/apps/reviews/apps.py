from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.reviews"

    def ready(self) -> None:
        from importlib import import_module

        import_module("apps.reviews.signals")
