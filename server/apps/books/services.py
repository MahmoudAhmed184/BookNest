from django.db import transaction
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from apps.books.models import Book, BookRating, BookReview, ReadingList
from apps.books.selectors import get_book_by_isbn


def create_review(*, user, book_id, serializer):
    book = get_book_by_isbn(book_id)
    if BookReview.objects.filter(user=user, book=book).exists():
        raise ValidationError({'error': 'You have already reviewed this book'})
    return serializer.save(user=user, book=book)


def create_rating(*, user, book_id, serializer):
    book = get_book_by_isbn(book_id)
    rating = serializer.save(user=user, book=book)
    recalculate_book_rating(book=book)
    return rating


def update_rating(*, serializer):
    rating = serializer.save()
    recalculate_book_rating(book=rating.book)
    return rating


def delete_rating(*, rating):
    book = rating.book
    rating.delete()
    recalculate_book_rating(book=book)


def recalculate_book_rating(*, book):
    stats = BookRating.objects.filter(book=book).aggregate(average=Avg('rate'))
    book.number_of_ratings = BookRating.objects.filter(book=book).count()
    book.average_rate = stats['average']
    book.save(update_fields=['number_of_ratings', 'average_rate'])
    return book


def add_book_to_reading_list(*, user, book_id, list_id):
    book = get_object_or_404(Book, isbn13=book_id)
    reading_list = get_object_or_404(ReadingList, list_id=list_id, profile__user=user)
    with transaction.atomic():
        created = not reading_list.books.filter(isbn13=book_id).exists()
        if created:
            reading_list.books.add(book)
    return book, reading_list, created


def remove_book_from_reading_list(*, user, book_id, list_id):
    book = get_object_or_404(Book, isbn13=book_id)
    reading_list = get_object_or_404(ReadingList, list_id=list_id, profile__user=user)
    with transaction.atomic():
        existed = reading_list.books.filter(isbn13=book_id).exists()
        if existed:
            reading_list.books.remove(book)
    return book, reading_list, existed
