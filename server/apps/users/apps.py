import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"

    def ready(self):
        logger.info("Loading users app signals...")
        logger.info("Users app signals loaded successfully")
