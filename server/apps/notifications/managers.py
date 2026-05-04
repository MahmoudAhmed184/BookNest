from django.db import models


class NotificationQuerySet(models.QuerySet):
    def for_recipient(self, user):
        return self.filter(recipient=user)

    def unread(self):
        return self.filter(read=False)

    def read(self):
        return self.filter(read=True)

    def with_related(self):
        return self.select_related(
            'recipient',
            'notification_type',
            'actor_content_type',
            'target_content_type',
            'action_object_content_type',
        )


class NotificationManager(models.Manager.from_queryset(NotificationQuerySet)):
    pass


class NotificationTypeQuerySet(models.QuerySet):
    def named(self, name):
        return self.filter(name=name)


class NotificationTypeManager(models.Manager.from_queryset(NotificationTypeQuerySet)):
    pass
