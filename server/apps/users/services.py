from __future__ import annotations

from typing import TYPE_CHECKING, Any

import cloudinary.uploader
from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.books.models import ReadingList

if TYPE_CHECKING:
    from apps.users.models.profile import Profile

DEFAULT_READING_LISTS = (
    {"name": "To Do", "type": "todo"},
    {"name": "Doing", "type": "doing"},
    {"name": "Completed", "type": "done"},
)

ALLOWED_PROFILE_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
}


def create_profile(*, user: Any, serializer: Any) -> Profile:
    with transaction.atomic():
        profile = serializer.save(user=user)
        profile.full_clean(exclude=["settings"])
        return profile


def update_profile(*, profile: Profile, serializer: Any) -> Profile:
    with transaction.atomic():
        updated_profile = serializer.save()
        updated_profile.full_clean(exclude=["settings"])
        return updated_profile


def create_default_reading_lists(*, profile: Profile) -> list[ReadingList]:
    reading_lists = []
    for list_data in DEFAULT_READING_LISTS:
        reading_list = ReadingList(
            profile=profile,
            name=list_data["name"],
            type=list_data["type"],
            privacy="private",
        )
        reading_list.full_clean()
        reading_list.save()
        reading_lists.append(reading_list)
    return reading_lists


def validate_profile_image(*, image_file: Any) -> str | None:
    if image_file.content_type not in ALLOWED_PROFILE_IMAGE_TYPES:
        allowed_types = ", ".join(sorted(ALLOWED_PROFILE_IMAGE_TYPES))
        return f"Invalid file type. Allowed types: {allowed_types}"
    if image_file.size > 5 * 1024 * 1024:
        return "File size too large. Maximum size is 5MB"
    return None


def upload_profile_picture(*, profile: Profile, image_file: Any) -> dict[str, Any]:
    with transaction.atomic():
        upload_result = cloudinary.uploader.upload(
            image_file,
            folder=f"profile_pics/{profile.user.username}/",
            public_id=f"{profile.user.username}_profile",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill"},
                {"quality": "auto"},
                {"format": "auto"},
            ],
        )
        profile.profile_pic = upload_result["secure_url"]
        profile.full_clean(exclude=["settings"])
        profile.save(update_fields=["profile_pic"])
        return upload_result


def blacklist_logout_tokens(*, user: Any, refresh_token: str | None = None) -> None:
    if refresh_token:
        refresh = RefreshToken(refresh_token)  # type: ignore[arg-type]
        refresh.blacklist()
        return

    if user.is_authenticated:
        tokens = OutstandingToken.objects.filter(user=user)
        for outstanding_token in tokens:
            BlacklistedToken.objects.get_or_create(token=outstanding_token)
