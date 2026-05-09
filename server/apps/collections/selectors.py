from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Q

from apps.collections.models import CollectionPrivacy, ReadingCollection, ReadingProgress
from apps.users import selectors as user_selectors

if TYPE_CHECKING:
    from django.db.models import QuerySet


def collection_queryset() -> QuerySet[ReadingCollection]:
    return ReadingCollection.objects.select_related("owner").prefetch_related("items__book")


def visible_collections_for_user(*, user: Any) -> QuerySet[ReadingCollection]:
    queryset = collection_queryset().filter(is_archived=False)
    if user.is_authenticated:
        return queryset.filter(Q(privacy=CollectionPrivacy.PUBLIC) | Q(owner=user))
    return queryset.filter(privacy=CollectionPrivacy.PUBLIC)


def owned_collections_for_user(*, user: Any) -> QuerySet[ReadingCollection]:
    return collection_queryset().filter(owner=user, is_archived=False)


def collections_for_target_user(*, target_user: Any, viewer: Any) -> QuerySet[ReadingCollection]:
    user_selectors.ensure_can_view_profile(target_user=target_user, viewer=viewer)
    queryset = collection_queryset().filter(owner=target_user, is_archived=False)
    if user_selectors.can_view_private_profile_data(target_user=target_user, viewer=viewer):
        return queryset
    return queryset.filter(privacy=CollectionPrivacy.PUBLIC)


def progress_queryset() -> QuerySet[ReadingProgress]:
    return ReadingProgress.objects.select_related("user", "book").filter(is_archived=False)


def progress_for_user(*, user: Any) -> QuerySet[ReadingProgress]:
    return progress_queryset().filter(user=user)
