from __future__ import annotations

from rest_framework import serializers

from apps.books import services
from apps.books.models import Author, AuthorLike, Book, BookAuthor, BookGenre, BookTrendSnapshot, Genre, RelatedBook


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = [
            "id",
            "name",
            "normalized_name",
            "slug",
            "bio",
            "photo",
            "photo_fallback_url",
            "birth_date",
            "death_date",
            "source",
            "books_count",
            "like_count",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("books_count", "like_count", "created_at", "updated_at")
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        name = attrs.get("name")
        if name and "normalized_name" not in attrs:
            attrs["normalized_name"] = services.normalize_label(name)
        if self.instance is None and name and not attrs.get("slug"):
            attrs["slug"] = services.unique_slug(model=Author, value=name, max_length=255)
        return attrs


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = [
            "id",
            "name",
            "normalized_name",
            "slug",
            "description",
            "parent",
            "books_count",
            "is_featured",
            "carousel_rank",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("books_count", "created_at", "updated_at")
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        name = attrs.get("name")
        if name and "normalized_name" not in attrs:
            attrs["normalized_name"] = services.normalize_label(name)
        if self.instance is None and name and not attrs.get("slug"):
            attrs["slug"] = services.unique_slug(model=Genre, value=name, max_length=140)
        return attrs


class AuthorLikeSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=Author.objects.filter(is_active=True))

    class Meta:
        model = AuthorLike
        fields = ["id", "user", "author", "created_at", "updated_at"]
        read_only_fields = ("id", "user", "created_at", "updated_at")
        validators = []


class BookSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    author_ids = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "subtitle",
            "slug",
            "description",
            "isbn_13",
            "isbn_10",
            "authors",
            "author_ids",
            "genres",
            "genre_ids",
            "related_books",
            "cover",
            "cover_fallback_url",
            "publisher",
            "publication_date",
            "publication_year",
            "page_count",
            "language",
            "source",
            "source_updated_at",
            "external_last_synced_at",
            "average_rating",
            "rating_count",
            "review_count",
            "collection_count",
            "read_count",
            "author_names",
            "genre_labels",
            "is_featured",
            "featured_rank",
            "popularity_score",
            "trending_score",
            "is_adult",
            "is_public",
            "is_archived",
            "archived_at",
            "archive_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "related_books",
            "average_rating",
            "rating_count",
            "review_count",
            "collection_count",
            "read_count",
            "author_names",
            "genre_labels",
            "is_archived",
            "archived_at",
            "archive_reason",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = services.unique_slug(model=Book, value=validated_data["title"], max_length=520)
        if validated_data.get("publication_date") and not validated_data.get("publication_year"):
            validated_data["publication_year"] = validated_data["publication_date"].year
        authors = validated_data.pop("author_ids", [])
        genres = validated_data.pop("genre_ids", [])
        book = Book.objects.create(**validated_data)
        services.apply_book_relationships(
            book=book,
            author_ids=[author.pk for author in authors],
            genre_ids=[genre.pk for genre in genres],
        )
        return book

    def update(self, instance, validated_data):
        if validated_data.get("publication_date") and not validated_data.get("publication_year"):
            validated_data["publication_year"] = validated_data["publication_date"].year
        authors = validated_data.pop("author_ids", None)
        genres = validated_data.pop("genre_ids", None)
        book = super().update(instance, validated_data)
        if authors is not None:
            services.set_book_authors(book=book, author_ids=[author.pk for author in authors])
        if genres is not None:
            services.set_book_genres(book=book, genre_ids=[genre.pk for genre in genres])
        return book


class BookAuthorSerializer(serializers.ModelSerializer):
    author_detail = AuthorSerializer(source="author", read_only=True)

    class Meta:
        model = BookAuthor
        fields = [
            "id",
            "book",
            "author",
            "author_detail",
            "role",
            "position",
            "contribution_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


class BookGenreSerializer(serializers.ModelSerializer):
    genre_detail = GenreSerializer(source="genre", read_only=True)

    class Meta:
        model = BookGenre
        fields = [
            "id",
            "book",
            "genre",
            "genre_detail",
            "is_primary",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


class RelatedBookSerializer(serializers.ModelSerializer):
    to_book = BookSerializer(read_only=True)
    to_book_id = serializers.PrimaryKeyRelatedField(source="to_book", queryset=Book.objects.visible(), write_only=True)

    class Meta:
        model = RelatedBook
        fields = [
            "id",
            "from_book",
            "to_book",
            "to_book_id",
            "relation_type",
            "score",
            "source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "to_book", "created_at", "updated_at")

    def validate(self, attrs):
        from_book = attrs.get("from_book") or getattr(self.instance, "from_book", None)
        to_book = attrs.get("to_book") or getattr(self.instance, "to_book", None)
        if from_book is not None and to_book is not None and from_book.pk == to_book.pk:
            raise serializers.ValidationError({"to_book_id": "A book cannot be related to itself."})
        return attrs


class BookTrendSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookTrendSnapshot
        fields = [
            "id",
            "book",
            "period",
            "metric_date",
            "view_count",
            "rating_count",
            "review_count",
            "collection_add_count",
            "search_click_count",
            "score",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at")
