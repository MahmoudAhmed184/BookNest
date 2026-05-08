from django.urls import path

from apps.books import views

urlpatterns = [
    path("books/", views.BookCollectionAPIView.as_view(), name="book-collection"),
    path("books/<int:pk>/", views.BookResourceAPIView.as_view(), name="book-resource"),
    path("book-authors/", views.BookAuthorCollectionAPIView.as_view(), name="book-author-collection"),
    path("book-authors/<int:pk>/", views.BookAuthorResourceAPIView.as_view(), name="book-author-resource"),
    path("book-genres/", views.BookGenreCollectionAPIView.as_view(), name="book-genre-collection"),
    path("book-genres/<int:pk>/", views.BookGenreResourceAPIView.as_view(), name="book-genre-resource"),
    path("related-books/", views.RelatedBookCollectionAPIView.as_view(), name="related-book-collection"),
    path("related-books/<int:pk>/", views.RelatedBookResourceAPIView.as_view(), name="related-book-resource"),
    path("books/<int:book_id>/related-books/", views.RelatedBookListAPIView.as_view(), name="related-book-list"),
    path(
        "book-trend-snapshots/",
        views.BookTrendSnapshotCollectionAPIView.as_view(),
        name="book-trend-snapshot-collection",
    ),
    path(
        "book-trend-snapshots/<int:pk>/",
        views.BookTrendSnapshotResourceAPIView.as_view(),
        name="book-trend-snapshot-resource",
    ),
    path("authors/", views.AuthorCollectionAPIView.as_view(), name="author-collection"),
    path("authors/<int:pk>/", views.AuthorResourceAPIView.as_view(), name="author-resource"),
    path("author-likes/", views.AuthorLikeCollectionAPIView.as_view(), name="author-like-collection"),
    path("author-likes/<int:pk>/", views.AuthorLikeResourceAPIView.as_view(), name="author-like-resource"),
    path("authors/<int:author_id>/books/", views.AuthorBookListAPIView.as_view(), name="author-books"),
    path("genres/", views.GenreCollectionAPIView.as_view(), name="genre-collection"),
    path("genres/<int:pk>/", views.GenreResourceAPIView.as_view(), name="genre-resource"),
    path("genres/<int:genre_id>/books/", views.GenreBookListAPIView.as_view(), name="genre-books"),
]
