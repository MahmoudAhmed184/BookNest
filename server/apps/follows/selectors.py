from django.shortcuts import get_object_or_404

from apps.follows.models import Follow
from apps.users.models.profile import Profile


def follow_relationships_for_user(user):
    return Follow.objects.involving_user(user).select_related(
        'follower__user',
        'followed__user',
    ).order_by('-created_at')


def followers_for_profile(profile):
    return Follow.objects.followers_of(profile).select_related(
        'follower__user',
        'followed__user',
    ).order_by('-created_at')


def following_for_profile(profile):
    return Follow.objects.following_of(profile).select_related(
        'follower__user',
        'followed__user',
    ).order_by('-created_at')


def get_profile(profile_id):
    return get_object_or_404(Profile.objects.with_related(), id=profile_id)


def get_follow(*, follower, followed):
    return get_object_or_404(
        Follow.objects.select_related('follower__user', 'followed__user'),
        follower=follower,
        followed=followed,
    )
