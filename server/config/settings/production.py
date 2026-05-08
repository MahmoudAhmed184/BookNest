import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import BASE_DIR, REST_AUTH, SIMPLE_JWT, SPECTACULAR_SETTINGS, STORAGES, env_bool, env_int, env_list

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY must be set in production.")

JWT_SIGNING_KEY = os.environ.get("JWT_SIGNING_KEY", "")
if not JWT_SIGNING_KEY:
    raise ImproperlyConfigured("JWT_SIGNING_KEY must be set in production.")
SIMPLE_JWT["SIGNING_KEY"] = JWT_SIGNING_KEY
REST_AUTH["JWT_AUTH_HTTPONLY"] = env_bool("JWT_AUTH_HTTPONLY", True)

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS must be set in production.")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SECURE_HSTS_SECONDS = env_int("SECURE_HSTS_SECONDS", 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", True)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "None")
CSRF_COOKIE_SAMESITE = os.environ.get("CSRF_COOKIE_SAMESITE", "None")
SECURE_REFERRER_POLICY = "same-origin"

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", CORS_ALLOWED_ORIGINS)

STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES["staticfiles"]["BACKEND"] = "whitenoise.storage.CompressedManifestStaticFilesStorage"

API_SCHEMA_PUBLIC = env_bool("API_SCHEMA_PUBLIC", False)
SPECTACULAR_SETTINGS["SERVE_PUBLIC"] = API_SCHEMA_PUBLIC
if not API_SCHEMA_PUBLIC:
    SPECTACULAR_SETTINGS["SERVE_PERMISSIONS"] = ["rest_framework.permissions.IsAdminUser"]
