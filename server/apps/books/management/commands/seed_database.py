import os
from collections import Counter
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.books.models import (
    Author,
    Book,
    BookAuthor,
    BookRating,
    BookReview,
    Genre,
    ReadingList,
)
from apps.books.services import recalculate_book_rating
from apps.follows.models import Follow
from apps.notifications.models import Notification, create_default_notification_types
from apps.recommendation.models import RecommendationModel, UserRecommendation
from apps.users.models.profile import Profile, ProfileInterest, ProfileSocialLink


User = get_user_model()


BOOKS = [
    {
        'isbn13': '9780000000001',
        'isbn': '0000000001',
        'title': 'The Clockwork Library',
        'description': 'A quiet fantasy about a city archive where lost books rewrite themselves.',
        'publication_date': date(2023, 4, 18),
        'number_of_pages': 352,
        'language': 'English',
        'authors': ['Ada L. Rivers'],
        'genres': ['Fantasy', 'Mystery'],
    },
    {
        'isbn13': '9780000000002',
        'isbn': '0000000002',
        'title': 'Signals in the Stacks',
        'description': 'A practical mystery following librarians who uncover a hidden recommendation system.',
        'publication_date': date(2024, 1, 9),
        'number_of_pages': 288,
        'language': 'English',
        'authors': ['Milo Chen'],
        'genres': ['Mystery', 'Technology'],
    },
    {
        'isbn13': '9780000000003',
        'isbn': '0000000003',
        'title': 'A Field Guide to Quiet Futures',
        'description': 'Essays about sustainable cities, public knowledge, and everyday tools.',
        'publication_date': date(2022, 9, 27),
        'number_of_pages': 224,
        'language': 'English',
        'authors': ['Nora Vale'],
        'genres': ['Nonfiction', 'Science'],
    },
    {
        'isbn13': '9780000000004',
        'isbn': '0000000004',
        'title': 'The Last Chapter Cafe',
        'description': 'A warm contemporary novel about readers rebuilding a neighborhood bookstore.',
        'publication_date': date(2021, 6, 15),
        'number_of_pages': 316,
        'language': 'English',
        'authors': ['June Harper'],
        'genres': ['Fiction', 'Romance'],
    },
    {
        'isbn13': '9780000000005',
        'isbn': '0000000005',
        'title': 'Deep Space Margins',
        'description': 'A science fiction adventure about annotated maps, found families, and long voyages.',
        'publication_date': date(2025, 2, 4),
        'number_of_pages': 410,
        'language': 'English',
        'authors': ['Samir Okafor', 'Lina Park'],
        'genres': ['Science Fiction', 'Adventure'],
    },
]


PROFILES = [
    {
        'username': 'maya_reader',
        'email': 'maya.reader@booknest.local',
        'first_name': 'Maya',
        'last_name': 'Reed',
        'bio': 'Reads speculative fiction and writes concise reviews.',
        'interests': ['Fantasy', 'Science Fiction', 'Mystery'],
    },
    {
        'username': 'leo_pages',
        'email': 'leo.pages@booknest.local',
        'first_name': 'Leo',
        'last_name': 'Page',
        'bio': 'Tracks every book club pick and shares practical notes.',
        'interests': ['Fiction', 'Nonfiction', 'Technology'],
    },
    {
        'username': 'nora_notes',
        'email': 'nora.notes@booknest.local',
        'first_name': 'Nora',
        'last_name': 'Stone',
        'bio': 'Collects thoughtful reads about cities, science, and people.',
        'interests': ['Science', 'Nonfiction', 'Romance'],
    },
]


READING_LIST_BOOKS = {
    'maya_reader': {
        ReadingList.ListType.TODO: ['9780000000005'],
        ReadingList.ListType.DOING: ['9780000000001'],
        ReadingList.ListType.DONE: ['9780000000002', '9780000000004'],
    },
    'leo_pages': {
        ReadingList.ListType.TODO: ['9780000000001', '9780000000003'],
        ReadingList.ListType.DOING: ['9780000000002'],
        ReadingList.ListType.DONE: ['9780000000004'],
    },
    'nora_notes': {
        ReadingList.ListType.TODO: ['9780000000002'],
        ReadingList.ListType.DOING: ['9780000000003'],
        ReadingList.ListType.DONE: ['9780000000001', '9780000000004'],
    },
}


RATINGS = {
    'maya_reader': {
        '9780000000001': Decimal('5.00'),
        '9780000000002': Decimal('4.50'),
        '9780000000004': Decimal('4.00'),
    },
    'leo_pages': {
        '9780000000002': Decimal('5.00'),
        '9780000000003': Decimal('4.00'),
        '9780000000004': Decimal('3.50'),
    },
    'nora_notes': {
        '9780000000001': Decimal('4.00'),
        '9780000000003': Decimal('4.50'),
        '9780000000005': Decimal('5.00'),
    },
}


REVIEWS = {
    ('maya_reader', '9780000000001'): 'A generous fantasy with a library that feels alive.',
    ('leo_pages', '9780000000002'): 'Useful mystery pacing and a clever technical backbone.',
    ('nora_notes', '9780000000003'): 'Clear, calm essays with practical optimism.',
}


class Command(BaseCommand):
    help = 'Seed BookNest with idempotent demo users, books, ratings, and recommendations.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-username',
            default=os.environ.get('SEED_ADMIN_USERNAME', 'admin'),
            help='Admin username to create or update.',
        )
        parser.add_argument(
            '--admin-email',
            default=os.environ.get('SEED_ADMIN_EMAIL', 'admin@booknest.local'),
            help='Admin email to create or update.',
        )
        parser.add_argument(
            '--admin-password',
            default=os.environ.get('SEED_ADMIN_PASSWORD', 'BookNestAdmin123!'),
            help='Admin password to set.',
        )
        parser.add_argument(
            '--user-password',
            default=os.environ.get('SEED_USER_PASSWORD', 'BookNestDemo123!'),
            help='Password to set for demo users.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.summary = Counter()

        create_default_notification_types()
        self.summary['notification_types_ready'] += 1

        genres = self.seed_genres()
        books = self.seed_books(genres)
        users = self.seed_users(options)
        profiles = self.seed_profiles(users)
        self.seed_reading_lists(profiles, books)
        self.seed_follows(profiles)
        self.seed_ratings(users, books)
        self.seed_reviews(users, books)
        self.seed_recommendations(users, books)
        self.seed_notifications(users)

        self.stdout.write(self.style.SUCCESS('BookNest seed completed.'))
        for key, value in sorted(self.summary.items()):
            self.stdout.write(f'{key}: {value}')

    def seed_genres(self):
        genres = {}
        for name in sorted({genre for book in BOOKS for genre in book['genres']}):
            genre, created = Genre.objects.get_or_create(
                name=name,
                defaults={'description': f'{name} books in the BookNest demo catalog.'},
            )
            genres[name] = genre
            self.summary['genres_created' if created else 'genres_existing'] += 1
        return genres

    def seed_books(self, genres):
        books = {}
        for book_data in BOOKS:
            author_names = book_data['authors']
            genre_names = book_data['genres']
            defaults = {
                key: value
                for key, value in book_data.items()
                if key not in {'isbn13', 'authors', 'genres'}
            }
            defaults['source'] = Book.Source.DATABASE
            book, created = Book.objects.update_or_create(
                isbn13=book_data['isbn13'],
                defaults=defaults,
            )
            books[book.isbn13] = book
            self.summary['books_created' if created else 'books_updated'] += 1

            for author_name in author_names:
                author, author_created = Author.objects.get_or_create(name=author_name)
                BookAuthor.objects.get_or_create(book=book, author=author)
                self.summary['authors_created' if author_created else 'authors_existing'] += 1

            book.genres.set([genres[name] for name in genre_names])

        for author in Author.objects.filter(name__in={name for book in BOOKS for name in book['authors']}):
            author.number_of_books = BookAuthor.objects.filter(author=author).count()
            author.save(update_fields=['number_of_books'])

        return books

    def seed_users(self, options):
        users = {}
        admin_defaults = {
            'email': options['admin_email'],
            'is_staff': True,
            'is_superuser': True,
        }
        admin, created = User.objects.get_or_create(
            username=options['admin_username'],
            defaults=admin_defaults,
        )
        for field, value in admin_defaults.items():
            setattr(admin, field, value)
        admin.set_password(options['admin_password'])
        admin.save()
        users[admin.username] = admin
        self.summary['admin_created' if created else 'admin_updated'] += 1

        for profile_data in PROFILES:
            user, created = User.objects.get_or_create(
                username=profile_data['username'],
                defaults={
                    'email': profile_data['email'],
                    'first_name': profile_data['first_name'],
                    'last_name': profile_data['last_name'],
                },
            )
            user.email = profile_data['email']
            user.first_name = profile_data['first_name']
            user.last_name = profile_data['last_name']
            user.set_password(options['user_password'])
            user.save()
            users[user.username] = user
            self.summary['users_created' if created else 'users_updated'] += 1

        return users

    def seed_profiles(self, users):
        profiles = {}
        profile_data_by_username = {profile['username']: profile for profile in PROFILES}
        for username, user in users.items():
            data = profile_data_by_username.get(username, {})
            profile, created = Profile.objects.update_or_create(
                user=user,
                defaults={
                    'bio': data.get('bio', 'BookNest administrator profile.'),
                    'profile_type': Profile.ProfileType.REGULAR,
                },
            )
            profiles[username] = profile
            self.summary['profiles_created' if created else 'profiles_updated'] += 1

            for interest in data.get('interests', []):
                _, interest_created = ProfileInterest.objects.get_or_create(
                    profile=profile,
                    interest=interest,
                )
                self.summary['interests_created' if interest_created else 'interests_existing'] += 1

            ProfileSocialLink.objects.get_or_create(
                profile=profile,
                platform=ProfileSocialLink.SocialPlatform.WEBSITE,
                defaults={'url': f'https://booknest.local/users/{username}'},
            )

        return profiles

    def seed_reading_lists(self, profiles, books):
        list_names = {
            ReadingList.ListType.TODO: 'To Do',
            ReadingList.ListType.DOING: 'Doing',
            ReadingList.ListType.DONE: 'Completed',
        }
        for username, list_map in READING_LIST_BOOKS.items():
            profile = profiles[username]
            for list_type, isbn_list in list_map.items():
                reading_list = ReadingList.objects.filter(
                    profile=profile,
                    type=list_type,
                    name=list_names[list_type],
                ).first()
                if reading_list is None:
                    reading_list = ReadingList.objects.create(
                        profile=profile,
                        type=list_type,
                        name=list_names[list_type],
                        privacy=ReadingList.Privacy.PRIVATE,
                    )
                    self.summary['reading_lists_created'] += 1
                else:
                    self.summary['reading_lists_existing'] += 1

                for isbn13 in isbn_list:
                    book = books[isbn13]
                    if not reading_list.books.filter(isbn13=isbn13).exists():
                        reading_list.books.add(book)
                        self.summary['reading_list_books_added'] += 1

    def seed_follows(self, profiles):
        for follower_username, followed_username in (
            ('maya_reader', 'leo_pages'),
            ('leo_pages', 'nora_notes'),
            ('nora_notes', 'maya_reader'),
        ):
            _, created = Follow.objects.get_or_create(
                follower=profiles[follower_username],
                followed=profiles[followed_username],
            )
            self.summary['follows_created' if created else 'follows_existing'] += 1

    def seed_ratings(self, users, books):
        touched_books = set()
        for username, ratings in RATINGS.items():
            for isbn13, rating_value in ratings.items():
                rating, created = BookRating.objects.update_or_create(
                    user=users[username],
                    book=books[isbn13],
                    defaults={'rate': rating_value},
                )
                touched_books.add(rating.book)
                self.summary['ratings_created' if created else 'ratings_updated'] += 1

        for book in touched_books:
            recalculate_book_rating(book=book)

    def seed_reviews(self, users, books):
        for (username, isbn13), review_text in REVIEWS.items():
            _, created = BookReview.objects.update_or_create(
                user=users[username],
                book=books[isbn13],
                defaults={'review_text': review_text},
            )
            self.summary['reviews_created' if created else 'reviews_updated'] += 1

    def seed_recommendations(self, users, books):
        model, _ = RecommendationModel.objects.update_or_create(
            model_type=RecommendationModel.ModelType.SVD,
            defaults={
                'is_active': True,
                'min_ratings_per_user': 3,
                'n_factors': 25,
                'knn_k': 10,
                'rmse': 0.82,
                'mae': 0.64,
            },
        )
        RecommendationModel.objects.exclude(pk=model.pk).update(is_active=False)

        recommendations = {
            'maya_reader': [('9780000000003', 4.35), ('9780000000005', 4.25)],
            'leo_pages': [('9780000000001', 4.40), ('9780000000005', 4.10)],
            'nora_notes': [('9780000000002', 4.30), ('9780000000004', 3.95)],
        }
        for username, scored_books in recommendations.items():
            for isbn13, score in scored_books:
                _, created = UserRecommendation.objects.update_or_create(
                    user=users[username],
                    book=books[isbn13],
                    defaults={'score': score, 'model': model},
                )
                self.summary['recommendations_created' if created else 'recommendations_updated'] += 1

    def seed_notifications(self, users):
        for username in ('maya_reader', 'leo_pages', 'nora_notes'):
            _, created = Notification.objects.get_or_create(
                recipient=users[username],
                verb='Your BookNest demo account is ready.',
                defaults={'data': {'seed': True}},
            )
            self.summary['notifications_created' if created else 'notifications_existing'] += 1
