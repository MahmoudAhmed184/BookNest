from rest_framework import generics
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly

from apps.books import selectors
from apps.books.models import Author, AuthorLike, Book, BookAuthor, BookGenre, BookTrendSnapshot, Genre, RelatedBook
from apps.books.serializers import (
    AuthorLikeSerializer,
    AuthorSerializer,
    BookAuthorSerializer,
    BookGenreSerializer,
    BookSerializer,
    BookTrendSnapshotSerializer,
    GenreSerializer,
    RelatedBookSerializer,
)


class BookCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return selectors.book_search_queryset(
            query=self.request.query_params.get("q", ""),
            include_adult=self.request.query_params.get("include_adult") == "true",
        )


class BookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return selectors.book_queryset(include_archived=self.request.method != "GET")

    def perform_destroy(self, instance: Book) -> None:
        instance.archive(reason="api_delete")


class AuthorCollectionAPIView(generics.ListCreateAPIView):
    queryset = selectors.author_queryset()
    serializer_class = AuthorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class AuthorResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class AuthorLikeCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = AuthorLikeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuthorLike.objects.select_related("user", "author").filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.instance, _created = AuthorLike.objects.get_or_create(
            user=self.request.user,
            author=serializer.validated_data["author"],
        )


class AuthorLikeResourceAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = AuthorLikeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuthorLike.objects.select_related("user", "author").filter(user=self.request.user)


class GenreCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = selectors.genre_queryset()
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(name__icontains=query)

        limit = self.request.query_params.get("limit")
        if limit is not None:
            try:
                limit_value = min(max(int(limit), 1), 100)
            except ValueError:
                limit_value = 20
            return queryset[:limit_value]

        return queryset


class GenreResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class BookAuthorCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookAuthor.objects.select_related("book", "author")
    serializer_class = BookAuthorSerializer
    permission_classes = [IsAdminUser]


class BookAuthorResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookAuthor.objects.select_related("book", "author")
    serializer_class = BookAuthorSerializer
    permission_classes = [IsAdminUser]


class BookGenreCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookGenre.objects.select_related("book", "genre")
    serializer_class = BookGenreSerializer
    permission_classes = [IsAdminUser]


class BookGenreResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookGenre.objects.select_related("book", "genre")
    serializer_class = BookGenreSerializer
    permission_classes = [IsAdminUser]


class RelatedBookCollectionAPIView(generics.ListCreateAPIView):
    queryset = RelatedBook.objects.select_related("from_book", "to_book")
    serializer_class = RelatedBookSerializer
    permission_classes = [IsAdminUser]


class RelatedBookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RelatedBook.objects.select_related("from_book", "to_book")
    serializer_class = RelatedBookSerializer
    permission_classes = [IsAdminUser]


class BookTrendSnapshotCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookTrendSnapshot.objects.select_related("book")
    serializer_class = BookTrendSnapshotSerializer
    permission_classes = [IsAdminUser]


class BookTrendSnapshotResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookTrendSnapshot.objects.select_related("book")
    serializer_class = BookTrendSnapshotSerializer
    permission_classes = [IsAdminUser]


class AuthorBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer

    def get_queryset(self):
        return selectors.books_for_author(author_id=self.kwargs["author_id"])


class GenreBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer

    def get_queryset(self):
        return selectors.books_for_genre(genre_id=self.kwargs["genre_id"])


class RelatedBookListAPIView(generics.ListAPIView):
    serializer_class = RelatedBookSerializer

    def get_queryset(self):
        return selectors.related_books_for_book(book_id=self.kwargs["book_id"])
