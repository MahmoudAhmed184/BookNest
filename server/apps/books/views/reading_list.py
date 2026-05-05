from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.books.selectors import reading_lists_owned_by_user, reading_lists_visible_to_user
from apps.books.serializers.book import ReadingListSerializer
from apps.books.services import add_book_to_reading_list, remove_book_from_reading_list
from apps.users.permissions import IsOwnerOrReadOnly


class ReadingListBookMembershipSerializer(serializers.Serializer):
    book_id = serializers.CharField(required=False)
    list_id = serializers.IntegerField(required=False)


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class ReadingListCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ReadingListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return []

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return reading_lists_owned_by_user(user=self.request.user)
        return reading_lists_visible_to_user(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(profile=self.request.user.profile)


class ReadingListResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReadingListSerializer
    lookup_field = "list_id"

    def get_permissions(self):
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        return []

    def get_queryset(self):
        if self.request.method in {"PUT", "PATCH", "DELETE"}:
            return reading_lists_owned_by_user(user=self.request.user)
        return reading_lists_visible_to_user(user=self.request.user)


class ReadingListBookMembershipAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    @extend_schema(
        request=ReadingListBookMembershipSerializer,
        responses={
            200: MessageSerializer,
            201: MessageSerializer,
            400: OpenApiResponse(description="Missing book_id or list_id."),
        },
        operation_id="createReadingListBookMembership",
    )
    def post(self, request, list_id=None, book_id=None):
        target_book_id = book_id or request.data.get("book_id")
        target_list_id = list_id or request.data.get("list_id")

        if not target_book_id or not target_list_id:
            return Response(
                {"error": "Both book_id and list_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        book, reading_list, created = add_book_to_reading_list(
            user=request.user,
            book_id=target_book_id,
            list_id=target_list_id,
        )
        if created:
            return Response(
                {"message": f'Added "{book.title}" to "{reading_list.name}"'},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"message": f'This book is already in "{reading_list.name}"'},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=ReadingListBookMembershipSerializer,
        responses={
            204: OpenApiResponse(description="Book removed from reading list."),
            400: OpenApiResponse(description="Missing book_id or list_id."),
            404: MessageSerializer,
        },
        operation_id="deleteReadingListBookMembership",
    )
    def delete(self, request, list_id=None, book_id=None):
        target_book_id = book_id or request.data.get("book_id")
        target_list_id = list_id or request.data.get("list_id")

        if not target_book_id or not target_list_id:
            return Response(
                {"error": "Both book_id and list_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        book, reading_list, existed = remove_book_from_reading_list(
            user=request.user,
            book_id=target_book_id,
            list_id=target_list_id,
        )
        if existed:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {"message": f'This book is not in "{reading_list.name}"'},
            status=status.HTTP_404_NOT_FOUND,
        )


class AdminUserReadingListsAPIView(generics.ListAPIView):
    """
    API endpoint that allows admins to view any user's reading lists by user ID.
    Requires admin privileges.
    """

    serializer_class = ReadingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        user = get_object_or_404(get_user_model(), id=user_id)
        return reading_lists_owned_by_user(user=user)
