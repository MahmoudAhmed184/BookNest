from .base import *  # noqa: F403
from .base import BASE_DIR, SIMPLE_JWT, STORAGES, env_bool

DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

SIMPLE_JWT["SIGNING_KEY"] = "booknest-test-jwt-signing-key"

if not env_bool("USE_MYSQL_TEST_DB", False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

MEDIA_ROOT = BASE_DIR / "test_media"
STORAGES["default"]["BACKEND"] = "django.core.files.storage.FileSystemStorage"

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
