from django.core.management.base import BaseCommand

from apps.integrations.services import ensure_default_sources


class Command(BaseCommand):
    help = "Create default external catalog sources and sync state rows."

    def handle(self, *_args, **_options):
        sources = ensure_default_sources()
        self.stdout.write(self.style.SUCCESS(f"Initialized {len(sources)} external catalog sources."))
