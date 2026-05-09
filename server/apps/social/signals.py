from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.collections.models import CollectionBook, CollectionPrivacy, ReadingCollection
from apps.reviews.models import Rating, Review
from apps.social.models import FollowRelationship
from apps.social.services import sync_follow_counts


@receiver(post_save, sender=FollowRelationship)
@receiver(post_delete, sender=FollowRelationship)
def sync_follow_relationship_counts(sender, instance: FollowRelationship, **_kwargs) -> None:
    del sender
    sync_follow_counts(follower=instance.follower, following=instance.following)


def _visibility_for_actor(actor, *, rating_event: bool = False, collection: ReadingCollection | None = None) -> str:
    try:
        if not actor.preferences.profile_public:
            return "private"
        if rating_event and not actor.preferences.show_ratings_publicly:
            return "private"
    except AttributeError:
        pass
    if collection and collection.privacy == CollectionPrivacy.PRIVATE:
        return "private"
    return "public"


def _content_type_for(obj):
    return ContentType.objects.get_for_model(obj, for_concrete_model=False)


def _create_feed_event_after_commit(
    *,
    actor,
    event_type: str,
    action_object,
    book=None,
    target=None,
    visibility: str = "public",
    payload: dict | None = None,
) -> None:
    def create() -> None:
        FeedEvent = FollowRelationship._meta.apps.get_model("social", "FeedEvent")
        target_values = {}
        if target is not None:
            target_values = {
                "target_content_type": _content_type_for(target),
                "target_object_id": target.pk,
            }
        FeedEvent.objects.get_or_create(
            actor=actor,
            event_type=event_type,
            action_content_type=_content_type_for(action_object),
            action_object_id=action_object.pk,
            defaults={
                "book": book,
                "visibility": visibility,
                "payload": payload or {},
                **target_values,
            },
        )

    transaction.on_commit(create)


@receiver(post_save, sender=Rating)
def rating_created_feed_event(sender, instance: Rating, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived:
        return
    _create_feed_event_after_commit(
        actor=instance.user,
        event_type="rating_created",
        action_object=instance,
        book=instance.book,
        target=instance.book,
        visibility=_visibility_for_actor(instance.user, rating_event=True),
        payload={"rating": instance.value, "book_id": instance.book_id},
    )


@receiver(post_save, sender=Review)
def review_created_feed_event(sender, instance: Review, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived:
        return
    _create_feed_event_after_commit(
        actor=instance.user,
        event_type="review_created",
        action_object=instance,
        book=instance.book,
        target=instance.book,
        visibility=_visibility_for_actor(instance.user),
        payload={"review_id": instance.id, "book_id": instance.book_id},
    )


@receiver(post_save, sender=CollectionBook)
def collection_book_feed_event(sender, instance: CollectionBook, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived:
        return
    actor = instance.added_by or instance.collection.owner
    _create_feed_event_after_commit(
        actor=actor,
        event_type="book_added",
        action_object=instance,
        book=instance.book,
        target=instance.collection,
        visibility=_visibility_for_actor(actor, collection=instance.collection),
        payload={"collection_id": instance.collection_id, "book_id": instance.book_id},
    )


@receiver(post_save, sender=ReadingCollection)
def collection_created_feed_event(sender, instance: ReadingCollection, created: bool, **_kwargs) -> None:
    del sender
    if not created or instance.is_archived or instance.is_default:
        return
    _create_feed_event_after_commit(
        actor=instance.owner,
        event_type="collection_created",
        action_object=instance,
        target=instance,
        visibility=_visibility_for_actor(instance.owner, collection=instance),
        payload={"collection_id": instance.id, "privacy": instance.privacy},
    )
