# views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from users.models import CustomUser
from .user_data_serializer import UserDataSerializer

class UserDataDetailView(generics.RetrieveAPIView):
    """
    Retrieve all data associated with a specific user.
    Includes profile, reading lists, ratings, reviews, and social connections.
    """
    serializer_class = UserDataSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return CustomUser.objects.select_related('profile').prefetch_related(
            'profile__interests',
            'profile__social_links',
            'profile__following',
            'profile__followers',
            'profile__reading_lists__reading_list_books__book__authors',
            'profile__reading_lists__reading_list_books__book__genres',
            'ratings__book__authors',
            'ratings__book__genres',
            'reviews__book__authors',
            'reviews__book__genres'
        )
    
    def get_object(self):
        user_id = self.kwargs.get('id')
        return get_object_or_404(self.get_queryset(), id=user_id)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            return Response({
                'success': True,
                'message': 'User data retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error retrieving user data: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)