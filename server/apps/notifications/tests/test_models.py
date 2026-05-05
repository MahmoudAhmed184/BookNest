from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from apps.books.models import Book
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


class NotificationTypeModelTests(TestCase):
    def setUp(self) -> None:
        self.notification_type = NotificationType.objects.create(
            name="Test Type", description="A test notification type."
        )

    def test_notification_type_creation(self) -> None:
        self.assertEqual(self.notification_type.name, "Test Type")
        self.assertEqual(self.notification_type.description, "A test notification type.")

    def test_notification_type_str(self) -> None:
        self.assertEqual(str(self.notification_type), "Test Type")


class NotificationModelTests(TestCase):
    def setUp(self) -> None:
        self.user1 = User.objects.create_user(
            username="recipient_user", email="recipient@example.com", password="password123"
        )
        self.user2 = User.objects.create_user(username="actor_user", email="actor@example.com", password="password456")
        Notification.objects.filter(recipient__in=[self.user1, self.user2]).delete()
        self.book = Book.objects.create(isbn13="9780000000010", title="Target Book")
        self.notification_type = NotificationType.objects.create(
            name="Follow", description="User followed another user"
        )

        self.actor_content_type = ContentType.objects.get_for_model(self.user2)
        self.target_content_type = ContentType.objects.get_for_model(self.book)

        self.notification = Notification.objects.create(
            recipient=self.user1,
            actor_content_type=self.actor_content_type,
            actor_object_id=str(self.user2.pk),
            verb="followed",
            target_content_type=self.target_content_type,
            target_object_id=self.book.pk,
            notification_type=self.notification_type,
            data={"extra_info": "some value"},
        )

    def test_notification_creation(self) -> None:
        self.assertEqual(self.notification.recipient, self.user1)
        self.assertEqual(self.notification.actor, self.user2)
        self.assertEqual(self.notification.verb, "followed")
        self.assertEqual(self.notification.target, self.book)
        self.assertEqual(self.notification.notification_type, self.notification_type)
        self.assertFalse(self.notification.read)
        self.assertEqual(self.notification.data["extra_info"], "some value")

    def test_notification_str(self) -> None:
        expected_str = f"{self.user1.username} - followed"
        self.assertEqual(str(self.notification), expected_str)

    def test_mark_as_read(self) -> None:
        self.assertFalse(self.notification.read)
        self.notification.mark_as_read()
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.read)

    def test_mark_as_unread(self) -> None:
        self.notification.read = True
        self.notification.save()
        self.assertTrue(self.notification.read)
        self.notification.mark_as_unread()
        self.notification.refresh_from_db()
        self.assertFalse(self.notification.read)

    def test_notification_without_actor(self) -> None:
        system_notification_type = NotificationType.objects.create(name="System Update")
        notification = Notification.objects.create(
            recipient=self.user1, verb="system updated", notification_type=system_notification_type
        )
        self.assertIsNone(notification.actor)
        self.assertEqual(notification.verb, "system updated")

    def test_notification_ordering(self) -> None:
        Notification.objects.create(
            recipient=self.user1, verb="another action", notification_type=self.notification_type
        )
        notifications = Notification.objects.filter(recipient=self.user1)
        self.assertEqual(list(notifications.values_list("verb", flat=True)), ["another action", "followed"])

    def test_create_default_notification_types_function(self) -> None:
        from apps.notifications.models import create_default_notification_types

        initial_count = NotificationType.objects.count()
        create_default_notification_types()
        self.assertGreaterEqual(NotificationType.objects.count(), initial_count)
        self.assertTrue(NotificationType.objects.filter(name="follow").exists())
        self.assertTrue(NotificationType.objects.filter(name="book_review").exists())
        after_first_count = NotificationType.objects.count()
        create_default_notification_types()
        self.assertEqual(NotificationType.objects.count(), after_first_count)
