from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.utils import timezone
from apps.books.managers import (
    BookManager,
    BookRatingManager,
    BookReviewManager,
    ReadingListManager,
)


class Author(models.Model):

    author_id = models.AutoField(
        primary_key=True,
        verbose_name='author ID',
        help_text='Primary identifier for the author.',
    )
    name = models.CharField(
        verbose_name='name',
        max_length=255,
        help_text='Display name of the author.',
    )
    number_of_books = models.SmallIntegerField(
        verbose_name='number of books',
        default=0,
        help_text='Cached count of books linked to this author.',
    )
    class Meta:
        db_table = 'author'
        indexes = [
            models.Index(fields=['name'], name='author_name_idx'),
        ]
    def __str__(self):
        return self.name

class Book(models.Model):
    class Source(models.TextChoices):
        DATABASE = 'database', 'Database'
        OPEN_LIBRARY = 'openlibrary', 'OpenLibrary'
        GOOGLE_BOOKS = 'googlebooks', 'Google Books'
        USER = 'user', 'User Added'

    isbn13 = models.CharField(
        primary_key=True,
        max_length=13,
        verbose_name='ISBN-13',
        help_text='Thirteen-digit ISBN used as the book identifier.',
    )
    isbn = models.CharField(
        verbose_name='ISBN-10',
        max_length=10,
        null=True,
        blank=True,
        help_text='Optional ten-digit ISBN.',
    )
    cover_img = models.URLField(
        verbose_name='cover image',
        null=True,
        blank=True,
        help_text='URL for the book cover image.',
    )
    title = models.CharField(
        verbose_name='title',
        max_length=500,
        help_text='Book title.',
    )
    description = models.TextField(
        verbose_name='description',
        null=True,
        blank=True,
        help_text='Optional book description.',
    )
    publication_date = models.DateField(
        verbose_name='publication date',
        null=True,
        blank=True,
        help_text='Date the book was published.',
    )
    number_of_pages = models.IntegerField(
        verbose_name='number of pages',
        null=True,
        blank=True,
        help_text='Total page count when known.',
    )
    number_of_ratings = models.IntegerField(
        verbose_name='number of ratings',
        default=0,
        help_text='Cached count of ratings for the book.',
    )
    average_rate = models.DecimalField(
        verbose_name='average rating',
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Cached average rating for the book.',
    )
    authors = models.ManyToManyField(
        'books.Author',
        related_name='books',
        through='BookAuthor',
        verbose_name='authors',
        help_text='Authors credited for this book.',
    )
    genres = models.ManyToManyField(
        'books.Genre',
        related_name='books',
        verbose_name='genres',
        help_text='Genres associated with this book.',
    )
    language = models.CharField(
        verbose_name='language',
        max_length=100,
        null=True,
        blank=True,
        help_text='Comma-separated list of languages.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the book record was created.',
    )
    last_updated = models.DateTimeField(
        verbose_name='last updated',
        auto_now=True,
        help_text='Timestamp when the book record was last updated.',
    )
    source = models.CharField(
        verbose_name='source',
        max_length=20,
        choices=Source.choices,
        default=Source.DATABASE,
        help_text='Origin of the book metadata.',
    )
    objects = BookManager()

    class Meta:
        db_table = "book"
        indexes = [
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
    id = models.AutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the book-author relationship.',
    )
    book = models.ForeignKey(
        'books.Book', 
        on_delete=models.CASCADE,
        db_column='book_id',
        verbose_name='book',
        help_text='Book in this authorship relationship.',
    )
    author = models.ForeignKey(
        'books.Author',
        on_delete=models.CASCADE,
        db_column='author_id',
        verbose_name='author',
        help_text='Author in this authorship relationship.',
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

    class Privacy(models.TextChoices):
        PUBLIC = 'public', 'Public'
        PRIVATE = 'private', 'Private'

    class ListType(models.TextChoices):
        TODO = 'todo', 'To Do'
        DOING = 'doing', 'Doing'
        DONE = 'done', 'Done'
        CUSTOM = 'custom', 'Custom'

    list_id = models.AutoField(
        primary_key=True,
        verbose_name='list ID',
        help_text='Primary identifier for the reading list.',
    )
    name = models.TextField(
        verbose_name='name',
        help_text='Display name for the reading list.',
    )
    books = models.ManyToManyField(
        'books.Book',
        through='ReadingListBooks',
        verbose_name='books',
        help_text='Books included in this reading list.',
    )
    type = models.CharField(
        verbose_name='type',
        max_length=10,
        choices=ListType.choices,
        help_text='Reading workflow type for the list.',
    )
    privacy = models.CharField(
        verbose_name='privacy',
        max_length=10,
        choices=Privacy.choices,
        default=Privacy.PUBLIC,
        help_text='Visibility setting for the reading list.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the reading list was created.',
    )
    profile = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='reading_lists',
        verbose_name='profile',
        help_text='Profile that owns this reading list.',
    )
    objects = ReadingListManager()

    class Meta:
        db_table = 'Reading_List'
    def __str__(self):
        return self.name

class ReadingListBooks(models.Model):

    id = models.AutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the reading-list book entry.',
    )

    readinglist = models.ForeignKey(
        'books.ReadingList',
        on_delete=models.CASCADE,
        related_name='reading_list_books',
        verbose_name='reading list',
        help_text='Reading list containing the book.',
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='reading_list_books',
        verbose_name='book',
        help_text='Book included in the reading list.',
    )

    class Meta:
        db_table = 'Reading_List_Books'
        
    def __str__(self):
        return self.book.title

class BookRating(models.Model):

    rate_id = models.AutoField(
        primary_key=True,
        verbose_name='rating ID',
        help_text='Primary identifier for the rating.',
    )
    average_rate = models.DecimalField(
        verbose_name='average rating',
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Average book rating at the time this rating was saved.',
    )
    rate = models.DecimalField(
        verbose_name='rating',
        max_digits=3,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(5)
        ],
        help_text='Rating value from 0 to 5.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings',
        verbose_name='user',
        help_text='User who submitted the rating.',
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='ratings',
        verbose_name='book',
        help_text='Book being rated.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the rating was created.',
    )
    objects = BookRatingManager()
    
    class Meta:
        db_table = 'Book_Rating'
        unique_together = ('user', 'book')

    def __str__(self):
        return f'{self.user.username} rated {self.book.title} with {self.rate}'
    
    
class BookReview(models.Model):
    review_id = models.AutoField(
        primary_key=True,
        verbose_name='review ID',
        help_text='Primary identifier for the review.',
    )
    review_text = models.TextField(
        verbose_name='review text',
        help_text='Body text of the review.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the review was created.',
    )
    updated_at = models.DateTimeField(
        verbose_name='updated at',
        auto_now=True,
        help_text='Timestamp when the review was last updated.',
    )
    upvotes_count = models.IntegerField(
        verbose_name='upvotes count',
        default=0,
        help_text='Cached count of upvotes on the review.',
    )
    downvotes_count = models.IntegerField(
        verbose_name='downvotes count',
        default=0,
        help_text='Cached count of downvotes on the review.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='user',
        help_text='User who wrote the review.',
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='book',
        help_text='Book being reviewed.',
    )
    objects = BookReviewManager()

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
    class VoteType(models.TextChoices):
        UPVOTE = 'upvote', 'Upvote'
        DOWNVOTE = 'downvote', 'Downvote'
    
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the review vote.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_votes',
        verbose_name='user',
        help_text='User who cast the vote.',
    )
    review = models.ForeignKey(
        'books.BookReview',
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name='review',
        help_text='Review receiving the vote.',
    )
    vote_type = models.CharField(
        verbose_name='vote type',
        max_length=10,
        choices=VoteType.choices,
        help_text='Type of vote cast on the review.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the vote was created.',
    )
    updated_at = models.DateTimeField(
        verbose_name='updated at',
        auto_now=True,
        help_text='Timestamp when the vote was last updated.',
    )

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
    upvote_id = models.AutoField(
        primary_key=True,
        verbose_name='upvote ID',
        help_text='Primary identifier for the upvote.',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_upvotes',
        verbose_name='user',
        help_text='User who upvoted the review.',
    )
    review = models.ForeignKey(
        'books.BookReview',
        on_delete=models.CASCADE,
        related_name='upvotes',
        verbose_name='review',
        help_text='Review receiving the upvote.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the upvote was created.',
    )

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
    id = models.BigAutoField(
        primary_key=True,
        verbose_name='ID',
        help_text='Primary identifier for the genre.',
    )
    name = models.CharField(
        verbose_name='name',
        max_length=100,
        unique=True,
        help_text='Unique genre name.',
    )
    description = models.TextField(
        verbose_name='description',
        blank=True,
        null=True,
        help_text='Optional description of the genre.',
    )
    created_at = models.DateTimeField(
        verbose_name='created at',
        auto_now_add=True,
        help_text='Timestamp when the genre was created.',
    )
    updated_at = models.DateTimeField(
        verbose_name='updated at',
        auto_now=True,
        help_text='Timestamp when the genre was last updated.',
    )

    class Meta:
        indexes = [
            models.Index(fields=['name'], name='genre_name_idx'),
        ]

    def __str__(self):
        return self.name

