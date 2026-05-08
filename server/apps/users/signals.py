from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.collections.services import create_default_collections_for_user
from apps.users.models import Profile
from apps.users.services import ensure_user_defaults

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_defaults(sender, instance, created, **kwargs) -> None:
    if not created:
        return
    ensure_user_defaults(user=instance)


@receiver(post_save, sender=Profile)
def create_default_collections(sender, instance: Profile, created, **kwargs) -> None:
    if created:
        create_default_collections_for_user(user=instance.user)
