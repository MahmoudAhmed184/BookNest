from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.social.models import FollowRelationship
from apps.social.services import sync_follow_counts


@receiver(post_save, sender=FollowRelationship)
@receiver(post_delete, sender=FollowRelationship)
def sync_follow_relationship_counts(sender, instance: FollowRelationship, **kwargs) -> None:
    sync_follow_counts(follower=instance.follower, following=instance.following)
