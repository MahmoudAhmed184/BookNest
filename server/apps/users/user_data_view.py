# views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .user_data_serializer import UserDataSerializer
from apps.users.selectors import get_user_data, user_data_queryset

class UserDataDetailView(generics.RetrieveAPIView):
    """
    Retrieve all data associated with a specific user.
    Includes profile, reading lists, ratings, reviews, and social connections.
    """
    serializer_class = UserDataSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return user_data_queryset()
    
    def get_object(self):
        return get_user_data(self.kwargs.get('id'))
    
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
