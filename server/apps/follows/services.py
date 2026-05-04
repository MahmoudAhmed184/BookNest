from rest_framework.exceptions import ValidationError

from apps.follows.models import Follow


def create_follow(*, follower, followed):
    if follower == followed:
        raise ValidationError({'error': 'You cannot follow yourself'})
    if Follow.objects.filter(follower=follower, followed=followed).exists():
        raise ValidationError({'error': 'You are already following this user'})
    return Follow.objects.create(follower=follower, followed=followed)


def delete_follow(*, follower, followed):
    follow = Follow.objects.get(follower=follower, followed=followed)
    follow.delete()
    return follow
