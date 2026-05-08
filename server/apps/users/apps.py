from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"

    def ready(self) -> None:
        from importlib import import_module

        import_module("apps.users.schema")
        import_module("apps.users.signals")
