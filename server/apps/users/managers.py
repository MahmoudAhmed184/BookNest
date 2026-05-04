from django.contrib.auth.models import BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)


class ProfileQuerySet(models.QuerySet):
    def with_related(self):
        return self.select_related('user').prefetch_related('interests', 'social_links')

    def for_username(self, username):
        return self.filter(user__username=username)

    def for_type(self, profile_type):
        return self.filter(profile_type=profile_type)


class ProfileManager(models.Manager.from_queryset(ProfileQuerySet)):
    pass
