from django.apps import AppConfig


class BooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.books"

    def ready(self):
        from importlib import import_module

        import_module("apps.books.signals")
