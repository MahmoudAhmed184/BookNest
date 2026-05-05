from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.users.models.profile import Profile
from apps.follows.models import Follow

User = get_user_model()

class FollowAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1_follow_api', email='user1_follow_api@example.com', password='password1')
        self.profile1, _ = Profile.objects.get_or_create(user=self.user1, defaults={'bio': 'Profile 1 Bio API'})
        
        self.user2 = User.objects.create_user(username='user2_follow_api', email='user2_follow_api@example.com', password='password2')
        self.profile2, _ = Profile.objects.get_or_create(user=self.user2, defaults={'bio': 'Profile 2 Bio API'})

        self.user3 = User.objects.create_user(username='user3_follow_api', email='user3_follow_api@example.com', password='password3')
        self.profile3, _ = Profile.objects.get_or_create(user=self.user3, defaults={'bio': 'Profile 3 Bio API'})

        # URLs
        self.follow_create_url = reverse('follow-collection')
        self.unfollow_url = lambda follow_id: reverse('follow-resource', kwargs={'id': follow_id})
        self.follower_list_url = reverse('current-profile-followers')
        self.following_list_url = reverse('current-profile-following')
        self.user_followers_url = lambda user_id: reverse('profile-followers', kwargs={'user_id': user_id})
        self.user_following_url = lambda user_id: reverse('profile-following', kwargs={'user_id': user_id})

    def test_follow_user_unauthenticated(self):
        response = self.client.post(self.follow_create_url, {'followed': self.profile2.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_follow_user_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.follow_create_url, {'followed': self.profile2.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Follow.objects.filter(follower=self.profile1, followed=self.profile2).exists())

    def test_follow_user_already_following(self):
        self.client.force_authenticate(user=self.user1)
        Follow.objects.create(follower=self.profile1, followed=self.profile2)
        response = self.client.post(self.follow_create_url, {'followed': self.profile2.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Assuming serializer validation handles this

    def test_follow_self_attempt(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.follow_create_url, {'followed': self.profile1.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Assuming serializer validation
        self.assertFalse(Follow.objects.filter(follower=self.profile1, followed=self.profile1).exists())

    def test_unfollow_user_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        follow = Follow.objects.create(follower=self.profile1, followed=self.profile2)
        self.assertTrue(Follow.objects.filter(follower=self.profile1, followed=self.profile2).exists())
        response = self.client.delete(self.unfollow_url(follow.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Follow.objects.filter(follower=self.profile1, followed=self.profile2).exists())

    def test_unfollow_user_not_following(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(self.unfollow_url(999999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Or appropriate error for not found

    def test_get_my_followers_list_authenticated(self):
        # user2 follows user1
        Follow.objects.create(follower=self.profile2, followed=self.profile1)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.follower_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['profile']['username'], self.profile2.user.username)

    def test_get_my_following_list_authenticated(self):
        # user1 follows user2
        Follow.objects.create(follower=self.profile1, followed=self.profile2)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.following_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['profile']['username'], self.profile2.user.username)

    def test_get_user_followers_list_public(self):
        # user1 follows user3, user2 follows user3
        Follow.objects.create(follower=self.profile1, followed=self.profile3)
        Follow.objects.create(follower=self.profile2, followed=self.profile3)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.user_followers_url(self.profile3.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)
        follower_usernames = [item['profile']['username'] for item in results]
        self.assertIn(self.profile1.user.username, follower_usernames)
        self.assertIn(self.profile2.user.username, follower_usernames)

    def test_get_user_following_list_public(self):
        # user1 follows user2 and user3
        Follow.objects.create(follower=self.profile1, followed=self.profile2)
        Follow.objects.create(follower=self.profile1, followed=self.profile3)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.user_following_url(self.profile1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)
        followed_usernames = [item['profile']['username'] for item in results]
        self.assertIn(self.profile2.user.username, followed_usernames)
        self.assertIn(self.profile3.user.username, followed_usernames)
