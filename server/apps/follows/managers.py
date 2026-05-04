from django.db import models
from django.db.models import Q


class FollowQuerySet(models.QuerySet):
    def involving_user(self, user):
        return self.filter(Q(follower__user=user) | Q(followed__user=user))

    def followers_of(self, profile):
        return self.filter(followed=profile)

    def following_of(self, profile):
        return self.filter(follower=profile)


class FollowManager(models.Manager.from_queryset(FollowQuerySet)):
    pass
