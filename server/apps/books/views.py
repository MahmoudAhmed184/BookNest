from rest_framework import generics, serializers
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAdminUser, IsAuthenticated

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
from apps.common.pagination import StandardResultsSetPagination


class BookCollectionQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="")
    include_adult = serializers.BooleanField(required=False, default=False)
    genres = serializers.CharField(required=False, allow_blank=True)
    genre_ids = serializers.CharField(required=False, allow_blank=True)
    authors = serializers.CharField(required=False, allow_blank=True)
    author_ids = serializers.CharField(required=False, allow_blank=True)
    languages = serializers.CharField(required=False, allow_blank=True)
    sources = serializers.CharField(required=False, allow_blank=True)
    min_rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    max_rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    publication_year_from = serializers.IntegerField(required=False, min_value=0)
    publication_year_to = serializers.IntegerField(required=False, min_value=0)
    page_count_min = serializers.IntegerField(required=False, min_value=1)
    page_count_max = serializers.IntegerField(required=False, min_value=1)
    is_featured = serializers.BooleanField(required=False)
    ordering = serializers.ChoiceField(
        choices=list(selectors.BOOK_ORDERINGS),
        required=False,
        default="trending",
    )

    def validate_q(self, value: str) -> str:
        value = value.strip()
        if value and len(value) < 2:
            raise serializers.ValidationError("Search query must be at least 2 characters long.")
        return value

    def validate(self, attrs):
        if (
            attrs.get("min_rating") is not None
            and attrs.get("max_rating") is not None
            and attrs["max_rating"] < attrs["min_rating"]
        ):
            raise serializers.ValidationError(
                {"max_rating": "Maximum rating must be greater than minimum rating."}
            )
        if (
            attrs.get("publication_year_from")
            and attrs.get("publication_year_to")
            and attrs["publication_year_to"] < attrs["publication_year_from"]
        ):
            raise serializers.ValidationError({"publication_year_to": "End year must be greater than start year."})
        if (
            attrs.get("page_count_min")
            and attrs.get("page_count_max")
            and attrs["page_count_max"] < attrs["page_count_min"]
        ):
            raise serializers.ValidationError(
                {"page_count_max": "Maximum page count must be greater than minimum page count."}
            )
        return attrs


class AuthorCollectionQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="")
    source = serializers.ChoiceField(choices=[choice[0] for choice in Author.Source.choices], required=False)
    include_inactive = serializers.BooleanField(required=False, default=False)
    ordering = serializers.ChoiceField(choices=list(selectors.AUTHOR_ORDERINGS), required=False, default="name")


class GenreCollectionQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="")
    parent = serializers.IntegerField(required=False, min_value=1)
    is_featured = serializers.BooleanField(required=False)
    ordering = serializers.ChoiceField(choices=list(selectors.GENRE_ORDERINGS), required=False, default="name")


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, _view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class BookCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        serializer = BookCollectionQuerySerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        filter_names = {
            "genres",
            "genre_ids",
            "authors",
            "author_ids",
            "languages",
            "sources",
            "min_rating",
            "max_rating",
            "publication_year_from",
            "publication_year_to",
            "page_count_min",
            "page_count_max",
            "is_featured",
        }
        return selectors.book_catalog_queryset(
            query=values.get("q", ""),
            include_adult=values.get("include_adult", False),
            filters={key: value for key, value in values.items() if key in filter_names},
            ordering=values.get("ordering", "trending"),
        )


class BookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return selectors.book_queryset(include_archived=self.request.method != "GET")

    def perform_destroy(self, instance: Book) -> None:
        instance.archive(reason="api_delete")


class AuthorCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = AuthorSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        serializer = AuthorCollectionQuerySerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        include_inactive = bool(values.get("include_inactive")) and self.request.user.is_staff
        return selectors.author_catalog_queryset(
            query=values.get("q", ""),
            source=values.get("source"),
            include_inactive=include_inactive,
            ordering=values.get("ordering", "name"),
        )


class AuthorResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AuthorSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return selectors.author_queryset(include_inactive=self.request.method != "GET")


class AuthorLikeCollectionAPIView(generics.ListCreateAPIView):
    serializer_class = AuthorLikeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

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
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        serializer = GenreCollectionQuerySerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        return selectors.genre_catalog_queryset(
            query=values.get("q", ""),
            parent_id=values.get("parent"),
            is_featured=values.get("is_featured"),
            ordering=values.get("ordering", "name"),
        )


class GenreResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminOrReadOnly]


class BookAuthorCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookAuthor.objects.select_related("book", "author")
    serializer_class = BookAuthorSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination


class BookAuthorResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookAuthor.objects.select_related("book", "author")
    serializer_class = BookAuthorSerializer
    permission_classes = [IsAdminUser]


class BookGenreCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookGenre.objects.select_related("book", "genre")
    serializer_class = BookGenreSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination


class BookGenreResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookGenre.objects.select_related("book", "genre")
    serializer_class = BookGenreSerializer
    permission_classes = [IsAdminUser]


class RelatedBookCollectionAPIView(generics.ListCreateAPIView):
    queryset = RelatedBook.objects.select_related("from_book", "to_book")
    serializer_class = RelatedBookSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination


class RelatedBookResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RelatedBook.objects.select_related("from_book", "to_book")
    serializer_class = RelatedBookSerializer
    permission_classes = [IsAdminUser]


class BookTrendSnapshotCollectionAPIView(generics.ListCreateAPIView):
    queryset = BookTrendSnapshot.objects.select_related("book")
    serializer_class = BookTrendSnapshotSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination


class BookTrendSnapshotResourceAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookTrendSnapshot.objects.select_related("book")
    serializer_class = BookTrendSnapshotSerializer
    permission_classes = [IsAdminUser]


class AuthorBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return selectors.books_for_author(author_id=self.kwargs["author_id"])


class GenreBookListAPIView(generics.ListAPIView):
    serializer_class = BookSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return selectors.books_for_genre(genre_id=self.kwargs["genre_id"])


class RelatedBookListAPIView(generics.ListAPIView):
    serializer_class = RelatedBookSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return selectors.related_books_for_book(book_id=self.kwargs["book_id"])
