from django.db import transaction

import cloudinary.uploader

from apps.books.models import ReadingList
from apps.users.models.profile import Profile


DEFAULT_READING_LISTS = (
    {'name': 'To Do', 'type': 'todo'},
    {'name': 'Doing', 'type': 'doing'},
    {'name': 'Completed', 'type': 'done'},
)

ALLOWED_PROFILE_IMAGE_TYPES = {
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
}


def create_profile(*, user, serializer):
    with transaction.atomic():
        return serializer.save(user=user)


def update_profile(*, profile, serializer):
    with transaction.atomic():
        return serializer.save()


def create_default_reading_lists(*, profile: Profile):
    return [
        ReadingList.objects.create(
            profile=profile,
            name=list_data['name'],
            type=list_data['type'],
            privacy='private',
        )
        for list_data in DEFAULT_READING_LISTS
    ]


def validate_profile_image(image_file):
    if image_file.content_type not in ALLOWED_PROFILE_IMAGE_TYPES:
        allowed_types = ', '.join(sorted(ALLOWED_PROFILE_IMAGE_TYPES))
        return f'Invalid file type. Allowed types: {allowed_types}'
    if image_file.size > 5 * 1024 * 1024:
        return 'File size too large. Maximum size is 5MB'
    return None


def upload_profile_picture(*, profile, image_file):
    with transaction.atomic():
        upload_result = cloudinary.uploader.upload(
            image_file,
            folder=f'profile_pics/{profile.user.username}/',
            public_id=f'{profile.user.username}_profile',
            overwrite=True,
            transformation=[
                {'width': 400, 'height': 400, 'crop': 'fill'},
                {'quality': 'auto'},
                {'format': 'auto'},
            ],
        )
        profile.profile_pic = upload_result['secure_url']
        profile.save(update_fields=['profile_pic'])
        return upload_result
