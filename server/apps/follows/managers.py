from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models
from django.db.models import Q

if TYPE_CHECKING:
    from apps.follows.models import Follow  # noqa: F401
    from apps.users.models.profile import Profile


class FollowQuerySet(models.QuerySet["Follow"]):
    def involving_user(self, user: Any) -> FollowQuerySet:
        return self.filter(Q(follower__user=user) | Q(followed__user=user))

    def followers_of(self, profile: Profile) -> FollowQuerySet:
        return self.filter(followed=profile)

    def following_of(self, profile: Profile) -> FollowQuerySet:
        return self.filter(follower=profile)


class FollowManager(models.Manager["Follow"]):
    def get_queryset(self) -> FollowQuerySet:
        return FollowQuerySet(self.model, using=self._db)

    def involving_user(self, user: Any) -> FollowQuerySet:
        return self.get_queryset().involving_user(user)

    def followers_of(self, profile: Profile) -> FollowQuerySet:
        return self.get_queryset().followers_of(profile)

    def following_of(self, profile: Profile) -> FollowQuerySet:
        return self.get_queryset().following_of(profile)
