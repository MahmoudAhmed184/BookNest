import os

from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

app = Celery("BookNest")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# TODO: Re-evaluate Django Tasks after a production backend with recurring schedules is selected.
# Django 6.0's built-in backends are development/test only, so Celery Beat remains the scheduler here.
app.conf.beat_schedule = {
    "sync-external-books": {
        "task": "apps.integrations.tasks.sync_external_books",
        "schedule": crontab(hour=0, minute=0),  # Run daily at midnight
    },
}
