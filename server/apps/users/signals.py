from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models.profile import Profile
import logging
from django.contrib.auth import get_user_model
from apps.notifications.services import NotificationService
from apps.users.services import create_default_reading_lists

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Profile)
def create_default_reading_lists(sender, instance, created, **kwargs):
    """Create default reading lists when a new profile is created"""
    if created:
        try:
            for reading_list in create_default_reading_lists(profile=instance):
                logger.info(f"Created {reading_list.name} list for user {instance.user.username}")
                
        except Exception as e:
            logger.error(f"Error creating reading lists for user {instance.user.username}: {str(e)}")
            raise 
        
@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):

    """
    Create a welcome notification when a new user is created.
    """
    
    if created:
        NotificationService.create_welcome_notification(instance)
