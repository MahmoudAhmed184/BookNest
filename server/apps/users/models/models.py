from django.contrib.auth.models import AbstractUser
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.users.managers import CustomUserManager

class CustomUser(AbstractUser):
    objects = CustomUserManager()
    def delete(self, *args, **kwargs):
        # Delete associated tokens
        OutstandingToken.objects.filter(user=self).delete()
        super().delete(*args, **kwargs)
    def __str__(self):
        return self.username
