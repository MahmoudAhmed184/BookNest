import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BookNest.settings')

app = Celery('BookNest')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'sync-external-books': {
        'task': 'books.tasks.sync_external_books',
        'schedule': crontab(hour=0, minute=0),  # Run daily at midnight
    },
    'update-book-metadata': {
        'task': 'books.tasks.update_book_metadata',
        'schedule': crontab(hour='*/6'),  # Run every 6 hours
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 