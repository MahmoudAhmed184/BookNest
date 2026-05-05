from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth.models import BaseUserManager
from django.db import models

if TYPE_CHECKING:
    from apps.users.models.profile import Profile  # noqa: F401
    from apps.users.models.user import CustomUser


class CustomUserManager(BaseUserManager["CustomUser"]):
    def create_user(self, username: str, email: str, password: str | None = None, **extra_fields: Any) -> CustomUser:
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, username: str, email: str, password: str | None = None, **extra_fields: Any
    ) -> CustomUser:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra_fields)


class ProfileQuerySet(models.QuerySet["Profile"]):
    def with_related(self) -> ProfileQuerySet:
        return self.select_related("user").prefetch_related("interests", "social_links")

    def for_username(self, username: str) -> ProfileQuerySet:
        return self.filter(user__username=username)

    def for_type(self, profile_type: str) -> ProfileQuerySet:
        return self.filter(profile_type=profile_type)


class ProfileManager(models.Manager["Profile"]):
    def get_queryset(self) -> ProfileQuerySet:
        return ProfileQuerySet(self.model, using=self._db)

    def with_related(self) -> ProfileQuerySet:
        return self.get_queryset().with_related()

    def for_username(self, username: str) -> ProfileQuerySet:
        return self.get_queryset().for_username(username)

    def for_type(self, profile_type: str) -> ProfileQuerySet:
        return self.get_queryset().for_type(profile_type)
