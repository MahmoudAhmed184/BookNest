from django.shortcuts import get_object_or_404

from apps.users.models import CustomUser
from apps.users.models.profile import Profile


def profile_list(*, username=None, profile_type=None):
    queryset = Profile.objects.with_related()
    if username:
        queryset = queryset.for_username(username)
    if profile_type:
        queryset = queryset.for_type(profile_type)
    return queryset


def profile_for_user(user):
    return Profile.objects.with_related().filter(user=user).first()


def profile_exists_for_user(user) -> bool:
    return Profile.objects.filter(user=user).exists()


def user_data_queryset():
    return CustomUser.objects.select_related('profile').prefetch_related(
        'profile__interests',
        'profile__social_links',
        'profile__following',
        'profile__followers',
        'profile__reading_lists__reading_list_books__book__authors',
        'profile__reading_lists__reading_list_books__book__genres',
        'ratings__book__authors',
        'ratings__book__genres',
        'reviews__book__authors',
        'reviews__book__genres',
    )


def get_user_data(user_id):
    return get_object_or_404(user_data_queryset(), id=user_id)
