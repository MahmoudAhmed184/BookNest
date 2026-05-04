from django.db import models
from apps.users.models.profile import Profile
from apps.follows.managers import FollowManager

class Follow(models.Model):
    """
    Model to represent a follow relationship between users.
    A user (follower) can follow another user (followed).
    """
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the follow relationship.',
    )
    follower = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='following',
        verbose_name='follower',
        help_text='Profile that initiated the follow relationship.',
    )
    followed = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='followers',
        verbose_name='followed',
        help_text='Profile being followed.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the follow relationship was created.',
    )
    objects = FollowManager()
    
    class Meta:
        unique_together = ('follower', 'followed')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.follower.user.username} follows {self.followed.user.username}"
    
    def save(self, *args, **kwargs):
        # Prevent users from following themselves
        if self.follower == self.followed:
            return
        super().save(*args, **kwargs)
