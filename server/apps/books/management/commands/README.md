# BookNest Books Management Commands

This directory contains Django management commands for maintaining the books catalog and its derived search data.

Run commands from `server/`:

```bash
uv run python manage.py <command>
```

## `fix_data_integrity`

Repairs imported or restored BookNest data so derived counters and relationships stay consistent.

When no specific fix option is provided, the command behaves like `--fix-all`.

### Options

| Option | Purpose |
| --- | --- |
| `--fix-all` | Run every integrity repair. |
| `--fix-author-counts` | Recalculate author book counts from `BookAuthor` rows. |
| `--fix-book-ratings` | Recalculate book rating counts and average ratings. |
| `--fix-review-counts` | Recalculate review upvote/downvote counters from current and legacy vote rows. |
| `--fix-missing-genres` | Attach `Uncategorized` to books that have no genre rows. |
| `--normalize-book-titles` | Trim and collapse whitespace in book titles. |
| `--dedupe-reading-list-books` | Remove duplicate rows for the same reading list and book. |
| `--ensure-profiles` | Create missing profiles for users. |
| `--reset-sequences` | Reset MariaDB auto-increment values for imported tables. |
| `--dry-run` | Report repairs without changing data. |
| `--batch-size <n>` | Set the bulk write batch size. Defaults to `1000`. |

### Usage

```bash
# Preview all repairs without writing changes.
uv run python manage.py fix_data_integrity --fix-all --dry-run

# Run all repairs.
uv run python manage.py fix_data_integrity --fix-all

# Run specific repairs.
uv run python manage.py fix_data_integrity --fix-author-counts --fix-book-ratings

# Normalize titles and remove duplicate reading-list entries in larger batches.
uv run python manage.py fix_data_integrity \
  --normalize-book-titles \
  --dedupe-reading-list-books \
  --batch-size 2000
```

## `rebuild_book_search_index`

Rebuilds denormalized book search documents from the current catalog data.

Use it after large imports, direct database restores, bulk edits to book/author/genre relationships, or data integrity repairs that affect searchable fields.

### Options

| Option | Purpose |
| --- | --- |
| `--batch-size <n>` | Number of books to process per iterator batch. Defaults to `500`. |

### Usage

```bash
# Rebuild with the default batch size.
uv run python manage.py rebuild_book_search_index

# Rebuild with a larger batch size.
uv run python manage.py rebuild_book_search_index --batch-size 1000
```

## Operational Notes

- Use `--dry-run` before destructive or large integrity repairs.
- Run repairs during low-traffic windows for large databases.
- Take a MariaDB backup before changing production data.
- Rebuild the search index after catalog repairs or imports that should affect search results.
- Recommendation commands live in `server/apps/recommendation/management/commands/`.
