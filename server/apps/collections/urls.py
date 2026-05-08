from django.urls import path

from apps.collections import views

urlpatterns = [
    path("reading-collections/", views.ReadingCollectionCollectionAPIView.as_view(), name="reading-collection-list"),
    path("reading-collections/<int:pk>/", views.ReadingCollectionResourceAPIView.as_view(), name="reading-collection"),
    path("collection-books/", views.CollectionBookCollectionAPIView.as_view(), name="collection-book-list"),
    path("collection-books/<int:pk>/", views.CollectionBookResourceAPIView.as_view(), name="collection-book"),
    path("reading-progress/", views.ReadingProgressCollectionAPIView.as_view(), name="reading-progress-list"),
    path("reading-progress/<int:pk>/", views.ReadingProgressResourceAPIView.as_view(), name="reading-progress"),
]
