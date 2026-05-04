from django.shortcuts import get_object_or_404

from apps.notifications.models import Notification


def notifications_for_user(user, *, read=None, notification_type=None):
    queryset = Notification.objects.for_recipient(user).with_related()
    if read is not None:
        queryset = queryset.filter(read=read)
    if notification_type:
        queryset = queryset.filter(notification_type__name=notification_type)
    return queryset.order_by('-timestamp')


def get_notification_for_user(*, notification_id, user):
    return get_object_or_404(Notification.objects.for_recipient(user), id=notification_id)


def unread_count_for_user(user):
    return Notification.objects.for_recipient(user).unread().count()
