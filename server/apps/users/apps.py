from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        logger.info("Loading users app signals...")
        import apps.users.signals
        logger.info("Users app signals loaded successfully")
