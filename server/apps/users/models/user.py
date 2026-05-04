from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.users.managers import CustomUserManager

class CustomUser(AbstractUser):
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the user account.',
    )
    password = models.CharField(
        verbose_name='password',
        max_length=128,
        help_text='Hashed password managed by Django authentication.',
    )
    last_login = models.DateTimeField(
        verbose_name='last login',
        blank=True,
        null=True,
        help_text='Timestamp of the most recent successful login.',
    )
    first_name = models.CharField(
        verbose_name='first name',
        max_length=150,
        blank=True,
        help_text='Optional given name for the user.',
    )
    last_name = models.CharField(
        verbose_name='last name',
        max_length=150,
        blank=True,
        help_text='Optional family name for the user.',
    )
    email = models.EmailField(
        verbose_name='email address',
        blank=True,
        help_text='Email address used for account communication and login.',
    )
    date_joined = models.DateTimeField(
        verbose_name='date joined',
        auto_now_add=True,
        help_text='Timestamp when the user account was created.',
    )

    objects = CustomUserManager()
    def delete(self, *args, **kwargs):
        # Delete associated tokens
        OutstandingToken.objects.filter(user=self).delete()
        super().delete(*args, **kwargs)
    def __str__(self):
        return self.username
