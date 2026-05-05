from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.notifications.services import NotificationService

from .models import Follow


# This will be used when the notifications app is integrated
# to create notifications when a user follows another user
@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    """
    Signal handler to create a notification when a user follows another user.
    This will be connected to the notifications system.
    """
    if created and hasattr(instance.followed.user, "profile"):
        # Create a notification for the followed user
        NotificationService.create_notification(
            recipient=instance.followed.user,
            actor=instance.follower.user,
            verb="followed you",
            target=instance.followed,
            action_object=instance,
            notification_type="follow",
        )
