from __future__ import annotations

from typing import Any

import cloudinary.uploader
from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Profile, UserPreference

ALLOWED_PROFILE_IMAGE_TYPES = {
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


@transaction.atomic
def ensure_user_defaults(*, user: Any) -> None:
    UserPreference.objects.get_or_create(user=user)


@transaction.atomic
def create_profile(*, user: Any, validated_data: dict[str, Any]) -> Profile:
    profile = Profile.objects.create(user=user, **validated_data)
    profile.full_clean()
    return profile


@transaction.atomic
def update_profile(*, profile: Profile, validated_data: dict[str, Any]) -> Profile:
    for field, value in validated_data.items():
        setattr(profile, field, value)
    profile.full_clean()
    profile.save()
    return profile


def validate_profile_image(*, image_file: Any) -> str | None:
    if image_file.content_type not in ALLOWED_PROFILE_IMAGE_TYPES:
        allowed_types = ", ".join(sorted(ALLOWED_PROFILE_IMAGE_TYPES))
        return f"Invalid file type. Allowed types: {allowed_types}"
    if image_file.size > 5 * 1024 * 1024:
        return "File size too large. Maximum size is 5MB"
    return None


def upload_profile_picture(*, profile: Profile, image_file: Any) -> dict[str, Any]:
    upload_result = cloudinary.uploader.upload(
        image_file,
        folder=f"profile_pictures/{profile.handle}/",
        public_id=f"{profile.handle}_profile",
        overwrite=True,
        transformation=[
            {"width": 400, "height": 400, "crop": "fill"},
            {"quality": "auto"},
            {"format": "auto"},
        ],
    )
    profile.picture = upload_result["secure_url"]
    profile.save(update_fields=["picture", "updated_at"])
    return upload_result


def blacklist_logout_tokens(*, user: Any, refresh_token: str | None = None) -> None:
    if refresh_token:
        refresh = RefreshToken(refresh_token)  # type: ignore[arg-type]
        refresh.blacklist()
        return

    if user.is_authenticated:
        for outstanding_token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding_token)
