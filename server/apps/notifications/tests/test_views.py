from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.notifications.models import Notification, NotificationType

User = get_user_model()


class NotificationAPITests(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.user1 = User.objects.create_user(username="testuser1", password="password123", email="test1@example.com")
        self.user2 = User.objects.create_user(username="testuser2", password="password456", email="test2@example.com")
        Notification.objects.filter(recipient__in=[self.user1, self.user2]).delete()

        self.type1 = NotificationType.objects.create(name="Test Notification Type 1", description="Desc 1")
        self.type2 = NotificationType.objects.create(name="Test Notification Type 2", description="Desc 2")

        self.actor_content_type = ContentType.objects.get_for_model(self.user2)

        self.notification1 = Notification.objects.create(
            recipient=self.user1,
            actor_content_type=self.actor_content_type,
            actor_object_id=self.user2.pk,
            verb="sent you a message",
            notification_type=self.type1,
        )
        self.notification2 = Notification.objects.create(
            recipient=self.user1, verb="liked your post", notification_type=self.type2, read=True
        )
        self.notification3 = Notification.objects.create(
            recipient=self.user2,
            verb="commented on your photo",
            notification_type=self.type1,
        )

        self.list_create_url = reverse("notification-collection")
        self.detail_url = lambda id: reverse("notification-resource", kwargs={"id": id})
        self.mark_read_url = lambda id: reverse("notification-mark-read", kwargs={"id": id})
        self.mark_unread_url = lambda id: reverse("notification-mark-unread", kwargs={"id": id})
        self.mark_all_read_url = reverse("notification-mark-all-read")
        self.unread_count_url = reverse("unread-notification-count")
        self.type_list_url = reverse("notification-type-list")
        self.type_detail_url = lambda id: reverse("notification-type-detail", kwargs={"id": id})

    def test_get_notification_list_unauthenticated(self) -> None:
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_notification_list_authenticated(self) -> None:
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["verb"], self.notification2.verb)
        self.assertEqual(response.data[1]["verb"], self.notification1.verb)

    def test_get_notification_detail_authenticated(self) -> None:
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.detail_url(self.notification1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["verb"], self.notification1.verb)

    def test_get_notification_detail_unauthorized_access(self) -> None:
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.detail_url(self.notification1.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_notification_as_read(self) -> None:
        self.client.force_authenticate(user=self.user1)
        self.assertFalse(Notification.objects.get(id=self.notification1.id).read)
        response = self.client.post(self.mark_read_url(self.notification1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["read"])
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.read)

    def test_mark_notification_as_unread(self) -> None:
        self.client.force_authenticate(user=self.user1)
        self.assertTrue(Notification.objects.get(id=self.notification2.id).read)
        response = self.client.post(self.mark_unread_url(self.notification2.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["read"])
        self.notification2.refresh_from_db()
        self.assertFalse(self.notification2.read)

    def test_mark_all_notifications_as_read(self) -> None:
        self.client.force_authenticate(user=self.user1)
        self.assertEqual(Notification.objects.filter(recipient=self.user1, read=False).count(), 1)
        response = self.client.post(self.mark_all_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(Notification.objects.filter(recipient=self.user1, read=False).count(), 0)

    def test_get_unread_notification_count(self) -> None:
        self.client.force_authenticate(user=self.user1)
        Notification.objects.filter(id=self.notification1.id).update(read=False)
        Notification.objects.filter(id=self.notification2.id).update(read=True)
        response = self.client.get(self.unread_count_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

        self.notification1.mark_as_read()
        response = self.client.get(self.unread_count_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_get_notification_type_list(self) -> None:
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.type_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), NotificationType.objects.count())

    def test_get_notification_type_detail(self) -> None:
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.type_detail_url(self.type1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.type1.name)
