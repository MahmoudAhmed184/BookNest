from django.db import models
from django.db.models import Q


class BookQuerySet(models.QuerySet):
    def with_catalog_data(self):
        return self.prefetch_related('authors', 'genres')

    def search_text(self, query):
        return self.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(authors__name__icontains=query)
            | Q(genres__name__icontains=query)
            | Q(isbn13__icontains=query)
            | Q(isbn__icontains=query)
        ).distinct()


class BookManager(models.Manager.from_queryset(BookQuerySet)):
    pass


class BookReviewQuerySet(models.QuerySet):
    def with_related(self):
        return self.select_related('user', 'book').prefetch_related('book__authors', 'book__genres')

    def for_book(self, book):
        return self.filter(book=book)

    def for_user(self, user):
        return self.filter(user=user)


class BookReviewManager(models.Manager.from_queryset(BookReviewQuerySet)):
    pass


class BookRatingQuerySet(models.QuerySet):
    def with_related(self):
        return self.select_related('user', 'book').prefetch_related('book__authors', 'book__genres')

    def for_book(self, book):
        return self.filter(book=book)

    def for_user(self, user):
        return self.filter(user=user)


class BookRatingManager(models.Manager.from_queryset(BookRatingQuerySet)):
    pass


class ReadingListQuerySet(models.QuerySet):
    def with_books(self):
        return self.select_related('profile__user').prefetch_related(
            'reading_list_books__book__authors',
            'reading_list_books__book__genres',
            'books',
        )

    def visible_to_user(self, user):
        if user.is_authenticated:
            return self.filter(Q(privacy='public') | Q(profile__user=user))
        return self.filter(privacy='public')

    def owned_by_user(self, user):
        return self.filter(profile__user=user)


class ReadingListManager(models.Manager.from_queryset(ReadingListQuerySet)):
    pass
