import re
from collections import Counter
from decimal import ROUND_HALF_UP, Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.management.color import no_style
from django.db import connection, transaction
from django.db.models import Avg, Count, Min, Q
from django.utils import timezone

from apps.books.models import (
    Book,
    BookAuthor,
    BookRating,
    BookReview,
    Genre,
    ReadingListBooks,
    ReviewUpvote,
    ReviewVote,
)
from apps.users.models.profile import Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Repair imported BookNest data so derived counts and relationships are consistent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fix-all",
            action="store_true",
            help="Run every integrity repair. This is also the default when no fix option is provided.",
        )
        parser.add_argument(
            "--fix-author-counts",
            action="store_true",
            help="Recalculate Author.number_of_books from author_books.",
        )
        parser.add_argument(
            "--fix-book-ratings",
            action="store_true",
            help="Recalculate Book.number_of_ratings and Book.average_rate from Book_Rating.",
        )
        parser.add_argument(
            "--fix-review-counts",
            action="store_true",
            help="Recalculate BookReview vote counters from Review_Vote and legacy Review_Upvote rows.",
        )
        parser.add_argument(
            "--fix-missing-genres",
            action="store_true",
            help="Attach Uncategorized to books that have no genre rows.",
        )
        parser.add_argument(
            "--normalize-book-titles",
            action="store_true",
            help="Trim and collapse whitespace in book titles.",
        )
        parser.add_argument(
            "--dedupe-reading-list-books",
            action="store_true",
            help="Remove duplicate rows for the same reading list and book.",
        )
        parser.add_argument(
            "--ensure-profiles",
            action="store_true",
            help="Create missing profiles for users.",
        )
        parser.add_argument(
            "--reset-sequences",
            action="store_true",
            help="Reset MariaDB auto-increment values for imported tables.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report repairs without changing data.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=1000,
            help="Bulk write batch size.",
        )

    def handle(self, *args, **options):
        self.summary = Counter()
        self.dry_run = options["dry_run"]
        self.batch_size = options["batch_size"]

        requested_fix = any(
            options[name]
            for name in (
                "fix_author_counts",
                "fix_book_ratings",
                "fix_review_counts",
                "fix_missing_genres",
                "normalize_book_titles",
                "dedupe_reading_list_books",
                "ensure_profiles",
                "reset_sequences",
            )
        )
        fix_all = options["fix_all"] or not requested_fix

        if fix_all or options["fix_author_counts"]:
            self.fix_author_counts()
        if fix_all or options["fix_book_ratings"]:
            self.fix_book_ratings()
        if fix_all or options["fix_review_counts"]:
            self.fix_review_counts()
        if fix_all or options["fix_missing_genres"]:
            self.fix_missing_genres()
        if fix_all or options["normalize_book_titles"]:
            self.normalize_book_titles()
        if fix_all or options["dedupe_reading_list_books"]:
            self.dedupe_reading_list_books()
        if fix_all or options["ensure_profiles"]:
            self.ensure_profiles()
        if fix_all or options["reset_sequences"]:
            self.reset_sequences()

        self.stdout.write(self.style.SUCCESS("Data integrity repair completed."))
        for key, value in sorted(self.summary.items()):
            self.stdout.write(f"{key}: {value}")

    def fix_author_counts(self):
        actual_counts = dict(
            BookAuthor.objects.values("author_id")
            .annotate(actual_count=Count("book_id"))
            .values_list("author_id", "actual_count")
        )

        authors_to_update = []
        for author in BookAuthor._meta.get_field("author").remote_field.model.objects.only(
            "author_id",
            "number_of_books",
        ):
            actual_count = actual_counts.get(author.author_id, 0)
            if author.number_of_books == actual_count:
                continue
            author.number_of_books = actual_count
            authors_to_update.append(author)

        self.summary["author_counts_to_fix"] = len(authors_to_update)
        if self.dry_run or not authors_to_update:
            return

        BookAuthor._meta.get_field("author").remote_field.model.objects.bulk_update(
            authors_to_update,
            ["number_of_books"],
            batch_size=self.batch_size,
        )
        self.summary["author_counts_fixed"] = len(authors_to_update)

    def fix_book_ratings(self):
        rating_stats = {
            row["book_id"]: {
                "count": row["rating_count"],
                "average": self.quantize_rating(row["average_rating"]),
            }
            for row in BookRating.objects.values("book_id").annotate(
                rating_count=Count("rate_id"),
                average_rating=Avg("rate"),
            )
        }

        books_to_update = []
        for book in Book.objects.only("isbn13", "number_of_ratings", "average_rate"):
            stats = rating_stats.get(book.isbn13, {"count": 0, "average": None})
            if book.number_of_ratings == stats["count"] and book.average_rate == stats["average"]:
                continue
            book.number_of_ratings = stats["count"]
            book.average_rate = stats["average"]
            books_to_update.append(book)

        self.summary["book_rating_stats_to_fix"] = len(books_to_update)
        if self.dry_run or not books_to_update:
            return

        Book.objects.bulk_update(
            books_to_update,
            ["number_of_ratings", "average_rate"],
            batch_size=self.batch_size,
        )
        self.summary["book_rating_stats_fixed"] = len(books_to_update)

    def fix_review_counts(self):
        vote_counts = {
            row["review_id"]: row
            for row in ReviewVote.objects.values("review_id").annotate(
                upvotes=Count("id", filter=Q(vote_type=ReviewVote.VoteType.UPVOTE)),
                downvotes=Count("id", filter=Q(vote_type=ReviewVote.VoteType.DOWNVOTE)),
            )
        }
        legacy_upvotes = dict(
            ReviewUpvote.objects.values("review_id")
            .annotate(upvotes=Count("upvote_id"))
            .values_list("review_id", "upvotes")
        )

        reviews_to_update = []
        for review in BookReview.objects.only("review_id", "upvotes_count", "downvotes_count"):
            counts = vote_counts.get(review.review_id, {})
            upvotes = counts.get("upvotes", 0) + legacy_upvotes.get(review.review_id, 0)
            downvotes = counts.get("downvotes", 0)
            if review.upvotes_count == upvotes and review.downvotes_count == downvotes:
                continue
            review.upvotes_count = upvotes
            review.downvotes_count = downvotes
            reviews_to_update.append(review)

        self.summary["review_vote_counts_to_fix"] = len(reviews_to_update)
        if self.dry_run or not reviews_to_update:
            return

        BookReview.objects.bulk_update(
            reviews_to_update,
            ["upvotes_count", "downvotes_count"],
            batch_size=self.batch_size,
        )
        self.summary["review_vote_counts_fixed"] = len(reviews_to_update)

    def fix_missing_genres(self):
        missing_book_ids = list(
            Book.objects.annotate(genre_count=Count("genres")).filter(genre_count=0).values_list("isbn13", flat=True)
        )
        self.summary["books_missing_genres"] = len(missing_book_ids)
        if self.dry_run or not missing_book_ids:
            return

        now = timezone.now()
        genre, _ = Genre.objects.get_or_create(
            name="Uncategorized",
            defaults={
                "description": "Books imported without source genre metadata.",
                "created_at": now,
                "updated_at": now,
            },
        )
        through_model = Book.genres.through
        through_model.objects.bulk_create(
            [through_model(book_id=book_id, genre_id=genre.id) for book_id in missing_book_ids],
            batch_size=self.batch_size,
            ignore_conflicts=True,
        )
        self.summary["missing_genres_fixed"] = len(missing_book_ids)

    def normalize_book_titles(self):
        books_to_update = []
        for book in Book.objects.only("isbn13", "title"):
            normalized_title = re.sub(r"\s+", " ", book.title or "").strip()
            if not normalized_title:
                normalized_title = book.isbn13
            if book.title == normalized_title:
                continue
            book.title = normalized_title
            books_to_update.append(book)

        self.summary["book_titles_to_normalize"] = len(books_to_update)
        if self.dry_run or not books_to_update:
            return

        Book.objects.bulk_update(books_to_update, ["title"], batch_size=self.batch_size)
        self.summary["book_titles_normalized"] = len(books_to_update)

    def dedupe_reading_list_books(self):
        duplicate_groups = list(
            ReadingListBooks.objects.values("readinglist_id", "book_id")
            .annotate(row_count=Count("id"), keep_id=Min("id"))
            .filter(row_count__gt=1)
        )
        duplicates_to_remove = sum(group["row_count"] - 1 for group in duplicate_groups)
        self.summary["reading_list_book_duplicates_to_remove"] = duplicates_to_remove
        if self.dry_run or not duplicate_groups:
            return

        with transaction.atomic():
            for group in duplicate_groups:
                ReadingListBooks.objects.filter(
                    readinglist_id=group["readinglist_id"],
                    book_id=group["book_id"],
                ).exclude(id=group["keep_id"]).delete()
        self.summary["reading_list_book_duplicates_removed"] = duplicates_to_remove

    def ensure_profiles(self):
        user_ids_with_profiles = set(Profile.objects.values_list("user_id", flat=True))
        missing_users = User.objects.exclude(id__in=user_ids_with_profiles)

        self.summary["profiles_to_create"] = missing_users.count()
        if self.dry_run:
            return

        for user in missing_users.iterator(chunk_size=self.batch_size):
            Profile.objects.get_or_create(user=user)
            self.summary["profiles_created"] += 1

    def reset_sequences(self):
        models = [
            User,
            Profile,
            Book,
            BookAuthor._meta.get_field("author").remote_field.model,
            BookAuthor,
            Genre,
            Book.genres.through,
            ReadingListBooks,
            BookRating,
            BookReview,
            ReviewVote,
            ReviewUpvote,
        ]
        sql_statements = connection.ops.sequence_reset_sql(no_style(), models)
        self.summary["sequences_to_reset"] = len(sql_statements)
        if self.dry_run or not sql_statements:
            return

        with connection.cursor() as cursor:
            for statement in sql_statements:
                cursor.execute(statement)
        self.summary["sequences_reset"] = len(sql_statements)

    def quantize_rating(self, value):
        if value is None:
            return None
        return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
