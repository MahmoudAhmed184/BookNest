# BookNest Data Integrity Management Commands

This directory contains management commands for maintaining data integrity in the BookNest application.

## fix_data_integrity.py

This command provides various options to fix data integrity issues in the BookNest database.

### Features

#### Author Data Integrity
- `--fix-author-counts`: Fix author book counts to match actual relationships
- `--update-data-quality`: Update author data quality fields based on available information

#### Book Data Integrity
- `--fix-missing-genres`: Ensure all books have at least one genre
- `--fix-book-ratings`: Fix book rating counts and average ratings
- `--normalize-book-titles`: Normalize book titles (trim whitespace, fix capitalization)
- `--fix-book-metadata`: Fix missing or invalid book metadata (ISBN, publication date, etc.)

#### General Options
- `--fix-all`: Run all data integrity fixes
- `--dry-run`: Show what would be fixed without making changes

### Usage

```bash
# Run all fixes
python manage.py fix_data_integrity --fix-all

# Preview what would be fixed without making changes
python manage.py fix_data_integrity --fix-all --dry-run

# Fix specific issues
python manage.py fix_data_integrity --fix-author-counts --fix-book-ratings
```

## setup_postgresql_search.py

This command sets up PostgreSQL full-text search indexes and optimizes database search performance.

### Features

- Creates GIN indexes for book titles, descriptions, and author names
- Updates search vectors for existing books

### Usage

```bash
# Set up PostgreSQL search
python manage.py setup_postgresql_search
```

## Overview

This directory contains management commands for maintaining data integrity in the BookNest application. These commands help ensure that the database remains consistent and that data quality is maintained.

## Available Commands

### fix_data_integrity.py

This command performs various data integrity checks and fixes on the books and authors data.

#### Features

- **Fix Author Book Counts**: Ensures that the `number_of_books` field for each author accurately reflects the actual number of books associated with that author.
- **Fix Missing Genres**: Ensures that all books have at least one genre, adding an "Unknown Genre" if none exists.
- **Update Data Quality**: Updates the `data_quality` field for authors based on the completeness of their information (bio, date of birth).

#### Usage

```bash
# Run all fixes
python manage.py fix_data_integrity --fix-all

# Run specific fixes
python manage.py fix_data_integrity --fix-author-counts --fix-missing-genres

# Dry run (show what would be fixed without making changes)
python manage.py fix_data_integrity --fix-all --dry-run
```

### setup_postgresql_search.py

This command sets up PostgreSQL full-text search indexes and optimizes the database for search performance.

#### Features

- **Create GIN Indexes**: Creates GIN indexes for full-text search on PostgreSQL.
- **Update Search Vectors**: Updates search vectors for existing books to improve search performance.

#### Usage

```bash
# Create GIN indexes
python manage.py setup_postgresql_search --create-gin-indexes

# Update search vectors
python manage.py setup_postgresql_search --update-search-vectors

# Run both operations
python manage.py setup_postgresql_search --create-gin-indexes --update-search-vectors
```

## Best Practices

1. Run these commands regularly as part of maintenance routines.
2. Use the `--dry-run` flag first to see what changes would be made.
3. Consider running these commands during off-peak hours for large databases.
4. Add these commands to your CI/CD pipeline or scheduled tasks to ensure ongoing data integrity.