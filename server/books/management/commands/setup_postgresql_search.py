from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.postgres.search import SearchVector
from books.models import Book
import logging

# Configure logging
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Setup PostgreSQL full-text search indexes and optimize database for search performance'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-gin-indexes',
            action='store_true',
            help='Create GIN indexes for full-text search (requires PostgreSQL)',
        )
        parser.add_argument(
            '--update-search-vectors',
            action='store_true',
            help='Update search vectors for existing books',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up PostgreSQL search optimization...'))
        
        if options['create_gin_indexes']:
            self.create_gin_indexes()
        
        if options['update_search_vectors']:
            self.update_search_vectors()
        
        self.stdout.write(self.style.SUCCESS('PostgreSQL search setup completed!'))
    
    def create_gin_indexes(self):
        """
        Create GIN indexes for full-text search on PostgreSQL.
        """
        self.stdout.write('Creating GIN indexes for full-text search...')
        
        with connection.cursor() as cursor:
            try:
                # Create GIN index for book title full-text search
                cursor.execute("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS book_title_gin_idx 
                    ON book USING gin(to_tsvector('english', title));
                """)
                self.stdout.write(self.style.SUCCESS('✓ Created GIN index for book titles'))
                
                # Create GIN index for book description full-text search
                cursor.execute("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS book_description_gin_idx 
                    ON book USING gin(to_tsvector('english', description));
                """)
                self.stdout.write(self.style.SUCCESS('✓ Created GIN index for book descriptions'))
                
                # Create GIN index for author names full-text search
                cursor.execute("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS author_name_gin_idx 
                    ON author USING gin(to_tsvector('english', name));
                """)
                self.stdout.write(self.style.SUCCESS('✓ Created GIN index for author names'))
                
                # Create composite GIN index for combined search
                cursor.execute("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS book_combined_search_gin_idx 
                    ON book USING gin((
                        setweight(to_tsvector('english', title), 'A') ||
                        setweight(to_tsvector('english', coalesce(description, '')), 'B')
                    ));
                """)
                self.stdout.write(self.style.SUCCESS('✓ Created combined GIN index for books'))
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating GIN indexes: {e}')
                )
                logger.error(f'Error creating GIN indexes: {e}')
    
    def update_search_vectors(self):
        """
        Update search statistics for existing books to improve search performance.
        """
        self.stdout.write('Updating search statistics for existing books...')
        
        try:
            # Run ANALYZE to update table statistics for better query planning
            with connection.cursor() as cursor:
                cursor.execute('ANALYZE book;')
                cursor.execute('ANALYZE author;')
                cursor.execute('ANALYZE book_genre;')
            
            total_books = Book.objects.count()
            self.stdout.write(self.style.SUCCESS(f'✓ Updated search statistics for {total_books} books'))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating search statistics: {e}')
            )
            logger.error(f'Error updating search statistics: {e}')
    
    def check_postgresql_version(self):
        """
        Check if PostgreSQL version supports full-text search features.
        """
        with connection.cursor() as cursor:
            cursor.execute('SELECT version();')
            version = cursor.fetchone()[0]
            self.stdout.write(f'PostgreSQL version: {version}')
            
            if 'PostgreSQL' not in version:
                self.stdout.write(
                    self.style.WARNING('Warning: Full-text search features require PostgreSQL')
                )
                return False
            return True