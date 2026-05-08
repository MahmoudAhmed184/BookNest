from django.apps import AppConfig


class RecommendationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.recommendations"

    def ready(self) -> None:
        from importlib import import_module

        import_module("apps.recommendations.signals")
