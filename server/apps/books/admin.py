from django.contrib import admin

from apps.books.models import Author, AuthorLike, Book, BookAuthor, BookGenre, BookTrendSnapshot, Genre, RelatedBook


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "books_count", "is_active")
    search_fields = ("name", "normalized_name")
    list_filter = ("source", "is_active")


@admin.register(AuthorLike)
class AuthorLikeAdmin(admin.ModelAdmin):
    list_display = ("user", "author", "created_at")
    search_fields = ("user__email", "author__name")


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "books_count", "is_featured", "carousel_rank")
    search_fields = ("name", "normalized_name")
    list_filter = ("is_featured",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "publication_year", "average_rating", "rating_count", "is_public", "is_archived")
    search_fields = ("title", "subtitle", "isbn_13", "isbn_10", "author_names", "genre_labels")
    list_filter = ("source", "is_featured", "is_adult", "is_public", "is_archived")


@admin.register(BookAuthor)
class BookAuthorAdmin(admin.ModelAdmin):
    list_display = ("book", "author", "role", "position")
    search_fields = ("book__title", "author__name")
    list_filter = ("role",)


@admin.register(BookGenre)
class BookGenreAdmin(admin.ModelAdmin):
    list_display = ("book", "genre", "is_primary", "position")
    search_fields = ("book__title", "genre__name")
    list_filter = ("is_primary",)


@admin.register(RelatedBook)
class RelatedBookAdmin(admin.ModelAdmin):
    list_display = ("from_book", "to_book", "relation_type", "score", "source")
    search_fields = ("from_book__title", "to_book__title")
    list_filter = ("relation_type",)


@admin.register(BookTrendSnapshot)
class BookTrendSnapshotAdmin(admin.ModelAdmin):
    list_display = ("book", "period", "metric_date", "score")
    search_fields = ("book__title",)
    list_filter = ("period", "metric_date")
