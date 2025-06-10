from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.operations import CreateExtension
from users.models.profile import Profile
import manage
from django.utils import timezone


class Author(models.Model):

    author_id = models.AutoField(primary_key=True)
    name = models.TextField()
    number_of_books = models.SmallIntegerField(default=0)
    class Meta:
        db_table = 'author'
        indexes = [
            models.Index(fields=['name'], name='author_name_idx'),
        ]
    def __str__(self):
        return self.name

class Book(models.Model):

    isbn13 = models.CharField(primary_key=True, max_length=13)
    isbn = models.CharField(max_length=10, null=True, blank=True)
    cover_img = models.URLField(null=True, blank=True)
    title = models.TextField(null=False)
    description = models.TextField(null=True, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    number_of_pages = models.IntegerField(null=True, blank=True)
    number_of_ratings = models.IntegerField(default=0)
    average_rate = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True
    )
    authors = models.ManyToManyField('books.Author', related_name='books', through='BookAuthor')
    genres = models.ManyToManyField('books.Genre', related_name='books')
    language = models.TextField(null=True, blank=True, help_text="Comma-separated list of languages")
    search_vector = SearchVectorField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    source = models.CharField(
        max_length=20,
        choices=[
            ('database', 'Database'),
            ('openlibrary', 'OpenLibrary'),
            ('googlebooks', 'Google Books'),
            ('user', 'User Added')
        ],
        default='database'
    )
    class Meta:
        db_table = "book"
        indexes = [
            # Full-text search indexes using GIN with gin_trgm_ops
            GinIndex(fields=['search_vector'], name='book_search_vector_idx'),
            GinIndex(fields=['title'], name='book_title_gin_idx', opclasses=['gin_trgm_ops']),
            GinIndex(fields=['description'], name='book_description_gin_idx', opclasses=['gin_trgm_ops']),
            # B-tree indexes for filtering
            models.Index(fields=['average_rate'], name='book_rating_idx'),
            models.Index(fields=['publication_date'], name='book_pub_date_idx'),
            models.Index(fields=['number_of_pages'], name='book_pages_idx'),
            models.Index(fields=['number_of_ratings'], name='book_ratings_count_idx'),
            # Composite indexes for common query patterns
            models.Index(fields=['average_rate', 'publication_date'], name='book_rating_date_idx'),
            models.Index(fields=['title', 'average_rate'], name='book_title_rating_idx'),
            # New indexes for tracking
            models.Index(fields=['last_updated'], name='book_last_updated_idx'),
            models.Index(fields=['source'], name='book_source_idx'),
            # Language index
            models.Index(fields=['language'], name='book_language_idx'),
        ]
        ordering = ['-average_rate', 'title']
    def __str__(self):
        return self.title


class BookAuthor(models.Model):
    id = models.AutoField(primary_key=True)
    book = models.ForeignKey(
        'books.Book', 
        on_delete=models.CASCADE,
        db_column='book_id'
    )
    author = models.ForeignKey(
        'books.Author',
        on_delete=models.CASCADE,
        db_column='author_id'
    )

    class Meta:
        db_table = 'author_books'
        unique_together = ('book', 'author')
        ordering = ['-id']

    def __str__(self):
        return self.author.name
        
    def save(self, *args, **kwargs):
        """Override save to update author book count"""
        # Check if this is a new instance (not in the database yet)
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Increment the author's book count
            self.author.number_of_books = models.F('number_of_books') + 1
            self.author.save(update_fields=['number_of_books'])
    
    def delete(self, *args, **kwargs):
        """Override delete to update author book count"""
        author = self.author
        super().delete(*args, **kwargs)
        
        # Decrement the author's book count, ensuring it doesn't go below 0
        if author.number_of_books > 0:
            author.number_of_books = models.F('number_of_books') - 1
            author.save(update_fields=['number_of_books'])

# class BookGenre(models.Model):
#     id = models.AutoField(primary_key=True)

#     book = models.ForeignKey(
#         'books.Book',
#         on_delete=models.CASCADE,
#         db_column='isbn13',
#         related_name='genres'
#     )
#     genre = models.ForeignKey(
#         'books.Genre',
#         on_delete=models.CASCADE,
#         related_name='book_genres'
#     )

#     class Meta:
#         db_table = 'book_genre'
#         indexes = [
#             models.Index(fields=['genre'], name='book_genre_idx'),
#             models.Index(fields=['book', 'genre'], name='book_genre_composite_idx'),
#         ]
#         unique_together = ('book', 'genre')  # Prevent duplicate genres for the same book
    
#     def __str__(self):
#         return self.genre
        
#     @classmethod
#     def ensure_book_has_genre(cls, book, genre=None):
#         """Ensure that a book has at least one genre, adding the provided genre or 'Unknown Genre' if none exists.
        
#         Args:
#             book: The Book instance to check
#             genre: Optional Genre instance to add if no genres exist
            
#         Returns:
#             bool: True if a genre was added, False if the book already had genres
#         """
#         if not cls.objects.filter(book=book).exists():
#             # If a specific genre is provided, use it; otherwise use 'Unknown Genre'
#             genre_name = genre.name if genre else 'Unknown Genre'
#             try:
#                 cls.objects.create(book=book, genre=genre_name)
#                 return True
#             except Exception as e:
#                 # Handle potential duplicate key error
#                 if 'unique constraint' not in str(e).lower():
#                     # Re-raise if it's not a duplicate issue
#                     raise
#                 # If it's a duplicate, just return False
#                 return False
#         return False

class ReadingList(models.Model):

    LIST_PRIVACY = (
        ('public', 'Public'),
        ('private', 'Private'),
    )
    LIST_TYPES = (
        ('todo', 'To Do'),
        ('doing', 'Doing'),
        ('done', 'Done'),
        ('custom', 'Custom'),
    )
    list_id = models.AutoField(primary_key=True)
    name = models.TextField()
    books = models.ManyToManyField('books.Book', through='ReadingListBooks')
    type = models.CharField(
        max_length=10,
        choices=LIST_TYPES,
    )
    privacy = models.CharField(
        max_length=10,
        choices=LIST_PRIVACY,
        default='public'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    profile = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='reading_lists'
    )
    class Meta:
        db_table = 'Reading_List'
    def __str__(self):
        return self.name

class ReadingListBooks(models.Model):

    id = models.AutoField(primary_key=True)

    readinglist = models.ForeignKey(
        'books.ReadingList',
        on_delete=models.CASCADE,
        related_name='reading_list_books'
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='reading_list_books'
    )

    class Meta:
        db_table = 'Reading_List_Books'
        
    def __str__(self):
        return self.book.title

class BookRating(models.Model):

    rate_id = models.AutoField(primary_key=True)
    average_rate = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True
    )
    rate = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(5)
        ]
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'Book_Rating'
        unique_together = ('user', 'book')

    def __str__(self):
        return f'{self.user.username} rated {self.book.title} with {self.rate}'
    
    
class BookReview(models.Model):
    review_id = models.AutoField(primary_key=True)
    review_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    upvotes_count = models.IntegerField(default=0)
    downvotes_count = models.IntegerField(default=0)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    class Meta:
        db_table = 'Book_Review'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-upvotes_count'], name='review_upvotes_idx'),
            models.Index(fields=['-created_at'], name='review_created_idx'),
            models.Index(fields=['book', '-upvotes_count'], name='book_review_upvotes_idx'),
        ]
    def __str__(self):
        return f'{self.user.username} review for {self.book.title}'
    
    @property
    def has_upvoted(self):
        """Property to check if current user has upvoted this review"""
        # This will be set dynamically in the serializer
        return getattr(self, '_has_upvoted', False)


class ReviewVote(models.Model):
    VOTE_CHOICES = [
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_votes'
    )
    review = models.ForeignKey(
        'books.BookReview',
        on_delete=models.CASCADE,
        related_name='votes'
    )
    vote_type = models.CharField(
        max_length=10,
        choices=VOTE_CHOICES
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Review_Vote'
        unique_together = ('user', 'review')  # One vote per user per review
        indexes = [
            models.Index(fields=['review'], name='vote_review_idx'),
            models.Index(fields=['user'], name='vote_user_idx'),
            models.Index(fields=['vote_type'], name='vote_type_idx'),
            models.Index(fields=['created_at'], name='vote_created_idx'),
        ]

    def __str__(self):
        return f'{self.user.username} {self.vote_type}d review {self.review.review_id}'
    
    def save(self, *args, **kwargs):
        """Override save to update review vote counts"""
        is_new = self.pk is None
        old_vote_type = None
        
        if not is_new:
            # Get the old vote type before updating
            old_instance = ReviewVote.objects.get(pk=self.pk)
            old_vote_type = old_instance.vote_type
        
        super().save(*args, **kwargs)
        
        # Update vote counts
        if is_new:
            # New vote
            if self.vote_type == 'upvote':
                self.review.upvotes_count = models.F('upvotes_count') + 1
            else:
                self.review.downvotes_count = models.F('downvotes_count') + 1
            self.review.save(update_fields=['upvotes_count', 'downvotes_count'])
        elif old_vote_type != self.vote_type:
            # Vote type changed
            if old_vote_type == 'upvote':
                self.review.upvotes_count = models.F('upvotes_count') - 1
                self.review.downvotes_count = models.F('downvotes_count') + 1
            else:
                self.review.downvotes_count = models.F('downvotes_count') - 1
                self.review.upvotes_count = models.F('upvotes_count') + 1
            self.review.save(update_fields=['upvotes_count', 'downvotes_count'])
    
    def delete(self, *args, **kwargs):
        """Override delete to update review vote counts"""
        review = self.review
        vote_type = self.vote_type
        super().delete(*args, **kwargs)
        
        # Decrement the appropriate vote count
        if vote_type == 'upvote' and review.upvotes_count > 0:
            review.upvotes_count = models.F('upvotes_count') - 1
        elif vote_type == 'downvote' and review.downvotes_count > 0:
            review.downvotes_count = models.F('downvotes_count') - 1
        review.save(update_fields=['upvotes_count', 'downvotes_count'])


# Keep the old ReviewUpvote model for backward compatibility
class ReviewUpvote(models.Model):
    """Model to track upvotes on reviews"""
    upvote_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_upvotes'
    )
    review = models.ForeignKey(
        'books.BookReview',
        on_delete=models.CASCADE,
        related_name='upvotes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Review_Upvote'
        unique_together = ('user', 'review')
        indexes = [
            models.Index(fields=['review'], name='upvote_review_idx'),
            models.Index(fields=['user'], name='upvote_user_idx'),
            models.Index(fields=['created_at'], name='upvote_created_idx'),
        ]

    def __str__(self):
        return f'{self.user.username} upvoted review {self.review.review_id}'

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            GinIndex(fields=['name'], name='genre_name_gin_idx', opclasses=['gin_trgm_ops']),
        ]

    def __str__(self):
        return self.name






