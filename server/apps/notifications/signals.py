import logging

from django.core.exceptions import ValidationError
from django.db import DatabaseError
from django.db.models import signals
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.books.models import BookRating, BookReview

logger = logging.getLogger(__name__)
NOTIFICATION_SIGNAL_ERRORS = (AttributeError, DatabaseError, TypeError, ValidationError, ValueError)


@receiver(signals.post_migrate)
def create_default_types(sender, **kwargs):
    """
    Create default notification types after migrations.
    """
    if sender.name == "notifications":
        from .models import create_default_notification_types

        create_default_notification_types()


@receiver(post_save, sender=BookReview)
def book_review_created(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a book review is created.
    Notifies book authors and users following the book.
    """
    if created:
        from apps.users.models import Profile

        from .services import NotificationService

        for book_author in instance.book.authors.all():
            try:
                author_profiles = Profile.objects.filter(profile_type="AUTHOR")
                for profile in author_profiles:
                    if profile.user:
                        NotificationService.create_notification(
                            recipient=profile.user,
                            actor=instance.user,
                            verb="reviewed your book",
                            target=instance.book,
                            action_object=instance,
                            notification_type="book_review",
                        )
            except NOTIFICATION_SIGNAL_ERRORS as exc:
                logger.warning("Error creating notification for author %s: %s", book_author.name, exc)


@receiver(post_save, sender=BookRating)
def book_rating_created(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a book rating is created.
    Notifies book authors about new ratings.
    """
    if created:
        from apps.users.models import Profile

        from .services import NotificationService

        for book_author in instance.book.authors.all():
            try:
                author_profiles = Profile.objects.filter(profile_type="AUTHOR")
                for profile in author_profiles:
                    if profile.user:
                        NotificationService.create_notification(
                            recipient=profile.user,
                            actor=instance.user,
                            verb=f"rated your book {instance.rate} stars",
                            target=instance.book,
                            action_object=instance,
                            notification_type="book_rating",
                        )
            except NOTIFICATION_SIGNAL_ERRORS as exc:
                logger.warning("Error creating notification for author %s: %s", book_author.name, exc)


@receiver(post_save, sender="books.ReadingListBooks")
def reading_list_book_added(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a book is added to a reading list.
    Notifies book authors when their books are added to reading lists.
    """
    if created:
        from apps.users.models import Profile

        from .services import NotificationService

        for book_author in instance.book.authors.all():
            try:
                author_profiles = Profile.objects.filter(profile_type="AUTHOR")
                for profile in author_profiles:
                    if profile.user:
                        NotificationService.create_notification(
                            recipient=profile.user,
                            actor=instance.readinglist.profile.user,
                            verb="added your book to their reading list",
                            target=instance.book,
                            action_object=instance.readinglist,
                            notification_type="system",
                        )
            except NOTIFICATION_SIGNAL_ERRORS as exc:
                logger.warning("Error creating notification for author %s: %s", book_author.name, exc)


def create_system_notification(recipients, message, data=None):
    """
    Create a system notification for multiple recipients.

    Args:
        recipients: List of users to receive the notification
        message: The notification message
        data: Additional data for the notification
    """
    from .services import NotificationService

    for recipient in recipients:
        NotificationService.create_notification(
            recipient=recipient, verb=message, notification_type="system", data=data or {}
        )
