from django.contrib import admin

from apps.follows.models import Follow
from apps.notifications.models import Notification, NotificationType
from apps.users.models import CustomUser, Profile, ProfileInterest, ProfileSocialLink

# Register your models here.
from .models import Author, Book, BookAuthor, BookRating, BookReview, ReadingList, ReadingListBooks

admin.site.register(Book)
admin.site.register(Author)
admin.site.register(BookAuthor)
admin.site.register(ReadingList)
admin.site.register(ReadingListBooks)
admin.site.register(BookRating)
admin.site.register(BookReview)
admin.site.register(Profile)
admin.site.register(ProfileInterest)
admin.site.register(ProfileSocialLink)
admin.site.register(Follow)
admin.site.register(CustomUser)
admin.site.register(Notification)
admin.site.register(NotificationType)
