from django.apps import AppConfig


class SocialConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.social"

    def ready(self) -> None:
        from importlib import import_module

        import_module("apps.social.signals")
