from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from apps.follows.models import Follow

if TYPE_CHECKING:
    from apps.users.models.profile import Profile


def create_follow(*, follower: Profile, followed: Profile) -> Follow:
    if follower == followed:
        raise ValidationError({"error": "You cannot follow yourself"})
    if Follow.objects.filter(follower=follower, followed=followed).exists():
        raise ValidationError({"error": "You are already following this user"})
    follow = Follow(follower=follower, followed=followed)
    follow.full_clean()
    follow.save()
    return follow


def delete_follow(*, follower: Profile, followed: Profile) -> Follow:
    follow = Follow.objects.get(follower=follower, followed=followed)
    follow.delete()
    return follow
