from cloudinary.models import CloudinaryField
from django.core.exceptions import ValidationError
from django.db import models

from apps.users.managers import ProfileManager

DEFAULT_PROFILE_PIC = "https://liwdokry.manus.space/image.svg"
DEFAULT_BIO = "Hey there! I'm new to BookNest."


def validate_image_size(value) -> None:
    """Validator to ensure uploaded files aren't too large"""
    filesize = value.size

    if filesize > 5 * 1024 * 1024:  # 5MB
        raise ValidationError("The maximum file size that can be uploaded is 5MB")


class Profile(models.Model):
    class ProfileType(models.TextChoices):
        REGULAR = "REGULAR", "Regular User"
        AUTHOR = "AUTHOR", "Author"
        PUBLISHER = "PUBLISHER", "Publisher"

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID",
        help_text="Primary identifier for the profile.",
    )
    # One-to-one relationship with User model
    user = models.OneToOneField(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name="user",
        help_text="User account that owns this profile.",
    )
    profile_pic = CloudinaryField(
        "image",
        max_length=500,
        folder="profile_pics/",  # Organize in a specific folder
        transformation=[
            {"width": 400, "height": 400, "crop": "fill"},  # Optional: resize
        ],
        blank=True,
        null=True,
        default=DEFAULT_PROFILE_PIC,
        help_text="Profile image URL or Cloudinary public identifier.",
    )
    bio = models.TextField(
        verbose_name="bio",
        max_length=500,
        blank=True,
        default=DEFAULT_BIO,
        help_text="Short public biography for the profile.",
    )
    profile_type = models.CharField(
        verbose_name="profile type",
        max_length=20,
        choices=ProfileType.choices,
        default=ProfileType.REGULAR,
        help_text="Role the profile represents in BookNest.",
    )
    settings = models.JSONField(
        verbose_name="settings",
        default=dict,
        help_text="User-specific profile preferences stored as JSON.",
    )
    created_at = models.DateTimeField(
        verbose_name="created at",
        auto_now_add=True,
        help_text="Timestamp when the profile was created.",
    )
    updated_at = models.DateTimeField(
        verbose_name="updated at",
        auto_now=True,
        help_text="Timestamp when the profile was last updated.",
    )

    objects = ProfileManager()

    def __str__(self) -> str:
        return f"{self.user.username}'s Profile"


class ProfileInterest(models.Model):
    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID",
        help_text="Primary identifier for the profile interest.",
    )
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="interests",
        verbose_name="profile",
        help_text="Profile this interest belongs to.",
    )
    interest = models.CharField(
        verbose_name="interest",
        max_length=100,
        help_text="Reading interest shown on the profile.",
    )

    class Meta:
        unique_together = ["profile", "interest"]  # Prevent duplicate interests for same profile

    def __str__(self) -> str:
        return f"{self.profile.user.username} - {self.interest}"


class ProfileSocialLink(models.Model):
    class SocialPlatform(models.TextChoices):
        TWITTER = "TWITTER", "Twitter"
        FACEBOOK = "FACEBOOK", "Facebook"
        INSTAGRAM = "INSTAGRAM", "Instagram"
        LINKEDIN = "LINKEDIN", "LinkedIn"
        GITHUB = "GITHUB", "GitHub"
        WEBSITE = "WEBSITE", "Personal Website"

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="ID",
        help_text="Primary identifier for the profile social link.",
    )
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="social_links",
        verbose_name="profile",
        help_text="Profile this social link belongs to.",
    )
    platform = models.CharField(
        verbose_name="platform",
        max_length=20,
        choices=SocialPlatform.choices,
        help_text="Social platform for the link.",
    )
    url = models.URLField(
        verbose_name="URL",
        help_text="Absolute URL to the profile social page.",
    )

    class Meta:
        unique_together = ["profile", "platform"]  # One link per platform per profile

    def __str__(self) -> str:
        return f"{self.profile.user.username} - {self.platform}"
