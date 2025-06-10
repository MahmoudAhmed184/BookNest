# import logging
# from django.core.management.base import BaseCommand
# from django.db import transaction
# from django.db.models import Count, F, Q
# from django.utils import timezone
# from books.models import Book, Author, BookAuthor

# logger = logging.getLogger(__name__)

# class Command(BaseCommand):
#     help = 'Fix data integrity issues in books and authors data'

#     def add_arguments(self, parser):
#         parser.add_argument(
#             '--fix-author-counts',
#             action='store_true',
#             help='Fix author book counts to match actual relationships',
#         )
#         parser.add_argument(
#             '--fix-missing-genres',
#             action='store_true',
#             help='Ensure all books have at least one genre',
#         )
#         parser.add_argument(
#             '--update-data-quality',
#             action='store_true',
#             help='Update author data quality fields based on available information',
#         )
#         parser.add_argument(
#             '--fix-book-ratings',
#             action='store_true',
#             help='Fix book rating counts and average ratings',
#         )
#         parser.add_argument(
#             '--normalize-book-titles',
#             action='store_true',
#             help='Normalize book titles (trim whitespace, fix capitalization)',
#         )
#         parser.add_argument(
#             '--fix-book-metadata',
#             action='store_true',
#             help='Fix missing or invalid book metadata (ISBN, publication date, etc.)',
#         )
#         parser.add_argument(
#             '--fix-all',
#             action='store_true',
#             help='Run all data integrity fixes',
#         )
#         parser.add_argument(
#             '--dry-run',
#             action='store_true',
#             help='Show what would be fixed without making changes',
#         )

#     def handle(self, *args, **options):
#         self.stdout.write(self.style.SUCCESS('Starting data integrity fixes...'))
#         self.dry_run = options['dry_run']
        
#         if options['fix_all'] or options['fix_author_counts']:
#             self.fix_author_book_counts()
        
#         if options['fix_all'] or options['fix_missing_genres']:
#             self.fix_missing_genres()
        
#         if options['fix_all'] or options['update_data_quality']:
#             self.update_author_data_quality()
        
#         if options['fix_all'] or options['fix_book_ratings']:
#             self.fix_book_ratings()
        
#         if options['fix_all'] or options['normalize_book_titles']:
#             self.normalize_book_titles()
        
#         if options['fix_all'] or options['fix_book_metadata']:
#             self.fix_book_metadata()
        
#         self.stdout.write(self.style.SUCCESS('Data integrity fixes completed!'))
    
#     def fix_author_book_counts(self):
#         """Fix author book counts to match actual relationships"""
#         self.stdout.write('Checking author book counts...')
        
#         # Get actual book counts for each author
#         author_book_counts = BookAuthor.objects.values('author').annotate(actual_count=Count('book'))
        
#         # Create a dictionary of author_id -> actual_count
#         count_dict = {item['author']: item['actual_count'] for item in author_book_counts}
        
#         # Find all authors
#         authors = Author.objects.all()
        
#         # Find authors with incorrect counts
#         authors_to_fix = []
#         for author in authors:
#             actual_count = count_dict.get(author.author_id, 0)
#             if author.number_of_books != actual_count:
#                 authors_to_fix.append((author, actual_count))
        
#         count = len(authors_to_fix)
#         self.stdout.write(f'Found {count} authors with incorrect book counts')
        
#         if self.dry_run:
#             for author, actual_count in authors_to_fix:
#                 self.stdout.write(f'  Would fix: {author.name} - Current: {author.number_of_books}, Actual: {actual_count}')
#             return
        
#         # Fix the counts
#         with transaction.atomic():
#             fixed = 0
#             for author, actual_count in authors_to_fix:
#                 self.stdout.write(f'  Fixing: {author.name} - Current: {author.number_of_books}, Actual: {actual_count}')
#                 author.number_of_books = actual_count
#                 author.save(update_fields=['number_of_books'])
#                 fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Fixed {fixed} author book counts'))
    
#     def fix_missing_genres(self):
#         """Ensure all books have at least one genre"""
#         self.stdout.write('Checking for books without genres...')
        
#         # Find books without any genres
#         books_without_genres = Book.objects.annotate(
#             genre_count=Count('genres')
#         ).filter(genre_count=0)
        
#         count = books_without_genres.count()
#         self.stdout.write(f'Found {count} books without genres')
        
#         if self.dry_run:
#             for book in books_without_genres:
#                 self.stdout.write(f'  Would add default genre to: {book.title}')
#             return
        
#         # Add default genre to books without genres
#         with transaction.atomic():
#             fixed = 0
#             for book in books_without_genres:
#                 self.stdout.write(f'  Adding default genre to: {book.title}')
#                 BookGenre.ensure_book_has_genre(book)
#                 fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Added default genre to {fixed} books'))
    
#     def update_author_data_quality(self):
#         """Update author data quality fields based on available information"""
#         self.stdout.write('Updating author data quality fields...')
        
#         # Get all authors
#         authors = Author.objects.all()
        
#         if self.dry_run:
#             for author in authors:
#                 new_quality = self._determine_data_quality(author)
#                 if author.data_quality != new_quality:
#                     self.stdout.write(f'  Would update {author.name} data quality: {author.data_quality} -> {new_quality}')
#             return
        
#         # Update data quality
#         with transaction.atomic():
#             fixed = 0
#             for author in authors:
#                 new_quality = self._determine_data_quality(author)
#                 if author.data_quality != new_quality:
#                     self.stdout.write(f'  Updating {author.name} data quality: {author.data_quality} -> {new_quality}')
#                     author.data_quality = new_quality
#                     author.last_updated = timezone.now()
#                     author.save(update_fields=['data_quality', 'last_updated'])
#                     fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Updated data quality for {fixed} authors'))
    
#     def _determine_data_quality(self, author):
#         """Determine data quality based on available author information"""
#         if author.bio and author.date_of_birth:
#             return 'complete'
#         elif author.bio or author.date_of_birth:
#             return 'partial'
#         else:
#             return 'minimal'
    
#     def fix_book_ratings(self):
#         """Fix book rating counts and average ratings"""
#         self.stdout.write('Checking book rating counts and averages...')
        
#         # Find books with incorrect rating counts
#         books_with_incorrect_counts = []
#         for book in Book.objects.all():
#             actual_rating_count = book.ratings.count()
#             if book.number_of_ratings != actual_rating_count:
#                 books_with_incorrect_counts.append((book, actual_rating_count))
        
#         count = len(books_with_incorrect_counts)
#         self.stdout.write(f'Found {count} books with incorrect rating counts')
        
#         if self.dry_run:
#             for book, actual_count in books_with_incorrect_counts:
#                 self.stdout.write(f'  Would fix: {book.title} - Current: {book.number_of_ratings}, Actual: {actual_count}')
#             return
        
#         # Fix the counts and recalculate averages
#         with transaction.atomic():
#             fixed = 0
#             for book, actual_count in books_with_incorrect_counts:
#                 self.stdout.write(f'  Fixing: {book.title} - Current: {book.number_of_ratings}, Actual: {actual_count}')
                
#                 # Update the count
#                 book.number_of_ratings = actual_count
                
#                 # Recalculate average rating if there are ratings
#                 if actual_count > 0:
#                     from django.db.models import Avg
#                     avg_rating = book.ratings.aggregate(avg=Avg('rate'))['avg']
#                     book.average_rate = avg_rating
#                 else:
#                     book.average_rate = None
                
#                 book.save(update_fields=['number_of_ratings', 'average_rate'])
#                 fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Fixed {fixed} book rating counts and averages'))
    
#     def normalize_book_titles(self):
#         """Normalize book titles (trim whitespace, fix capitalization)"""
#         self.stdout.write('Checking for book titles that need normalization...')
        
#         # Find books with titles that need normalization
#         books_to_normalize = []
#         for book in Book.objects.all():
#             original_title = book.title
#             normalized_title = original_title.strip()
            
#             # Check if title needs normalization
#             if original_title != normalized_title:
#                 books_to_normalize.append((book, normalized_title))
        
#         count = len(books_to_normalize)
#         self.stdout.write(f'Found {count} books with titles that need normalization')
        
#         if self.dry_run:
#             for book, normalized_title in books_to_normalize:
#                 self.stdout.write(f'  Would normalize: "{book.title}" -> "{normalized_title}"')
#             return
        
#         # Fix the titles
#         with transaction.atomic():
#             fixed = 0
#             for book, normalized_title in books_to_normalize:
#                 self.stdout.write(f'  Normalizing: "{book.title}" -> "{normalized_title}"')
#                 book.title = normalized_title
#                 book.save(update_fields=['title'])
#                 fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Normalized {fixed} book titles'))
    
#     def fix_book_metadata(self):
#         """Fix missing or invalid book metadata (ISBN, publication date, etc.)"""
#         self.stdout.write('Checking for books with invalid metadata...')
        
#         # Find books with invalid ISBNs
#         books_with_invalid_isbn = []
#         for book in Book.objects.all():
#             # Check ISBN-13 (primary key)
#             if book.isbn13 and not self._is_valid_isbn13(book.isbn13):
#                 books_with_invalid_isbn.append((book, 'isbn13'))
            
#             # Check ISBN-10
#             elif book.isbn and not self._is_valid_isbn(book.isbn):
#                 books_with_invalid_isbn.append((book, 'isbn'))
        
#         count = len(books_with_invalid_isbn)
#         self.stdout.write(f'Found {count} books with invalid ISBNs')
        
#         if self.dry_run:
#             for book, isbn_type in books_with_invalid_isbn:
#                 self.stdout.write(f'  Would fix invalid {isbn_type}: {book.title} - Current: {getattr(book, isbn_type)}')
#             return
        
#         # Fix the ISBNs
#         with transaction.atomic():
#             fixed = 0
#             for book, isbn_type in books_with_invalid_isbn:
#                 self.stdout.write(f'  Fixing invalid {isbn_type}: {book.title} - Current: {getattr(book, isbn_type)}')
                
#                 if isbn_type == 'isbn':
#                     # For ISBN-10, we can just set it to None as it's optional
#                     book.isbn = None
#                     book.save(update_fields=['isbn'])
#                 else:
#                     # For ISBN-13, we need to handle it differently as it's the primary key
#                     # This is a complex operation that would require creating a new book record
#                     # For now, we'll just log it as a warning
#                     self.stdout.write(self.style.WARNING(f'    Cannot automatically fix ISBN-13 as it is the primary key: {book.isbn13}'))
#                     continue
                
#                 fixed += 1
            
#             self.stdout.write(self.style.SUCCESS(f'Fixed {fixed} books with invalid ISBNs'))
    
#     def _is_valid_isbn13(self, isbn13):
#         """Check if an ISBN-13 is valid"""
#         if not isbn13 or not isinstance(isbn13, str):
#             return False
        
#         # Remove any hyphens or spaces
#         isbn13 = isbn13.replace('-', '').replace(' ', '')
        
#         # ISBN-13 must be 13 digits
#         if not isbn13.isdigit() or len(isbn13) != 13:
#             return False
        
#         # Check the checksum
#         sum = 0
#         for i in range(12):
#             if i % 2 == 0:
#                 sum += int(isbn13[i])
#             else:
#                 sum += 3 * int(isbn13[i])
        
#         check_digit = (10 - (sum % 10)) % 10
#         return check_digit == int(isbn13[12])
    
#     def _is_valid_isbn(self, isbn):
#         """Check if an ISBN-10 is valid"""
#         if not isbn or not isinstance(isbn, str):
#             return False
        
#         # Remove any hyphens or spaces
#         isbn = isbn.replace('-', '').replace(' ', '')
        
#         # ISBN-10 must be 10 characters (9 digits + check digit which could be 'X')
#         if len(isbn) != 10:
#             return False
        
#         # Check that first 9 characters are digits
#         if not isbn[:9].isdigit():
#             return False
        
#         # Check that last character is a digit or 'X'
#         if not (isbn[9].isdigit() or isbn[9].upper() == 'X'):
#             return False
        
#         # Calculate checksum
#         sum = 0
#         for i in range(9):
#             sum += int(isbn[i]) * (10 - i)
        
#         # Handle check digit
#         if isbn[9].upper() == 'X':
#             sum += 10
#         else:
#             sum += int(isbn[9])
        
#         return sum % 11 == 0