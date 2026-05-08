from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from apps.collections import selectors, services
from apps.collections.models import CollectionBook, ReadingCollection, ReadingProgress
from apps.collections.serializers import (
    CollectionBookSerializer,
    ReadingCollectionSerializer,
    ReadingProgressSerializer,
)


class ReadingCollectionCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ReadingCollectionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.query_params.get("mine") == "true":
            return selectors.owned_collections_for_user(user=self.request.user)
        return selectors.visible_collections_for_user(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ReadingCollectionResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReadingCollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.owned_collections_for_user(user=self.request.user)

    def perform_destroy(self, instance: ReadingCollection) -> None:
        instance.archive(reason="api_delete")


class CollectionBookCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = CollectionBookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CollectionBook.objects.select_related("collection", "book").filter(collection__owner=self.request.user)

    def perform_create(self, serializer):
        collection = serializer.validated_data["collection"]
        if collection.owner_id != self.request.user.id:
            raise PermissionDenied("You can only add books to your own collections.")
        serializer.instance = services.add_book_to_collection(
            collection=collection,
            book=serializer.validated_data["book"],
            added_by=self.request.user,
            status=serializer.validated_data.get("status", "todo"),
            notes=serializer.validated_data.get("notes", ""),
        )


class CollectionBookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CollectionBookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CollectionBook.objects.select_related("collection", "book").filter(collection__owner=self.request.user)

    def perform_destroy(self, instance: CollectionBook) -> None:
        services.remove_book_from_collection(item=instance)


class ReadingProgressCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.progress_for_user(user=self.request.user)

    def perform_create(self, serializer):
        serializer.instance = services.update_reading_progress(user=self.request.user, **serializer.validated_data)


class ReadingProgressResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return selectors.progress_for_user(user=self.request.user)

    def perform_destroy(self, instance: ReadingProgress) -> None:
        instance.archive(reason="api_delete")
