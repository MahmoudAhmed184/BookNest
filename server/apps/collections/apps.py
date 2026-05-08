from django.apps import AppConfig


class CollectionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.collections"

    def ready(self) -> None:
        from importlib import import_module

        import_module("apps.collections.signals")
