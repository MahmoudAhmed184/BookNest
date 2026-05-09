from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from apps.books.models import Author, AuthorLike, Book, BookAuthor, BookGenre, Genre
from apps.books.services import normalize_label, unique_slug
from apps.collections.models import CollectionBook, ReadingCollection, ReadingListType, ReadingProgress
from apps.recommendations.models import CatalogRecommendation, UserRecommendation
from apps.reviews.models import Rating, Review
from apps.search.models import SearchAutocompleteTerm, SearchIndexStatus

ARCHIVE_REASON = "catalog_cleanup_bad_metadata"

CANONICAL_GENRES = (
    "Fiction",
    "Nonfiction",
    "Action",
    "Classics",
    "Literary Fiction",
    "Contemporary",
    "Historical Fiction",
    "Fantasy",
    "High Fantasy",
    "Urban Fantasy",
    "Science Fiction",
    "Speculative Fiction",
    "Dystopian",
    "Post Apocalyptic",
    "Steampunk",
    "Cyberpunk",
    "Space Opera",
    "Alternate History",
    "Time Travel",
    "Horror",
    "Paranormal",
    "Supernatural",
    "Occult",
    "Magic",
    "Vampires",
    "Witches",
    "Ghosts",
    "Zombies",
    "Mystery",
    "Cozy Mystery",
    "Historical Mystery",
    "Thriller",
    "Suspense",
    "Crime",
    "True Crime",
    "Romance",
    "Contemporary Romance",
    "Historical Romance",
    "Paranormal Romance",
    "Romantic Suspense",
    "Christian Fiction",
    "Christian Romance",
    "Westerns",
    "Adventure",
    "Young Adult",
    "Children's",
    "Middle Grade",
    "Picture Books",
    "Light Novel",
    "Comics",
    "Graphic Novels",
    "Manga",
    "Superheroes",
    "Poetry",
    "Drama",
    "Plays",
    "Short Stories",
    "Essays",
    "Anthologies",
    "Humor",
    "Biography",
    "Autobiography",
    "Memoir",
    "History",
    "War",
    "Politics",
    "Social Science",
    "Sociology",
    "Anthropology",
    "Philosophy",
    "Psychology",
    "Religion",
    "Spirituality",
    "Mythology",
    "Fairy Tales",
    "Folklore",
    "Science",
    "Popular Science",
    "Technology",
    "Programming",
    "Computer Science",
    "Mathematics",
    "Business",
    "Economics",
    "Finance",
    "Leadership",
    "Management",
    "Education",
    "Self Help",
    "Personal Development",
    "Health",
    "Mental Health",
    "Medicine",
    "Travel",
    "Food and Drink",
    "Cooking",
    "Art",
    "Art History",
    "Photography",
    "Music",
    "Film",
    "Theatre",
    "Architecture",
    "Design",
    "Fashion",
    "Crafts",
    "Nature",
    "Animals",
    "Environment",
    "Gardening",
    "Sports",
    "Games",
    "Parenting",
    "Relationships",
    "Family",
    "Coming of Age",
    "LGBTQ",
    "Law",
    "Reference",
    "Writing",
    "Language",
    "Holiday",
)

FEATURED_GENRES = (
    "Fiction",
    "Nonfiction",
    "Mystery",
    "Thriller",
    "Romance",
    "Fantasy",
    "Science Fiction",
    "Historical Fiction",
    "Young Adult",
    "Children's",
    "Biography",
    "History",
    "Self Help",
    "Business",
    "Science",
    "Classics",
    "Horror",
    "Comics",
    "Graphic Novels",
    "Memoir",
    "Poetry",
    "Religion",
    "Philosophy",
    "Travel",
)

REUSABLE_ALIASES = {
    "Children's": ("Childrens",),
    "Dystopian": ("Dystopia",),
    "Post Apocalyptic": ("Apocalyptic",),
    "Coming of Age": ("Coming Of Age",),
}

GENRE_ALIASES = {
    "Abuse": ("Social Science",),
    "Academia": ("Education",),
    "Accounting": ("Finance", "Business"),
    "Activism": ("Politics", "Social Science"),
    "Adolescence": ("Young Adult",),
    "Adoption": ("Family",),
    "African American": ("Social Science",),
    "Agriculture": ("Science", "Nature"),
    "Aircraft": ("Technology",),
    "Airships": ("Science Fiction",),
    "Alchemy": ("Occult",),
    "Alcohol": ("Food and Drink",),
    "Algorithms": ("Computer Science", "Programming"),
    "Aliens": ("Science Fiction",),
    "Amateur Sleuth": ("Mystery",),
    "American Classics": ("Classics",),
    "American Civil War": ("History", "War"),
    "American Revolution": ("History", "War"),
    "American Revolutionary War": ("History", "War"),
    "Americana": ("History",),
    "Ancient": ("History",),
    "Ancient History": ("History",),
    "Angels": ("Paranormal", "Religion"),
    "Animal Fiction": ("Animals", "Fiction"),
    "Anime": ("Manga",),
    "Antiquities": ("History",),
    "Archaeology": ("History",),
    "Arithmetic": ("Mathematics",),
    "Art Design": ("Art", "Design"),
    "Arthurian": ("Fantasy", "Mythology"),
    "Artificial Intelligence": ("Computer Science", "Technology"),
    "Astrology": ("Occult", "Spirituality"),
    "Astronomy": ("Science",),
    "Asian Literature": (),
    "Atheism": ("Religion", "Philosophy"),
    "Atlases": ("Reference", "Travel"),
    "Audiobook": (),
    "Aviation": ("Technology",),
    "Baseball": ("Sports",),
    "Batman": ("Comics", "Superheroes"),
    "Biography Memoir": ("Biography", "Memoir"),
    "Biology": ("Science",),
    "Birds": ("Animals", "Nature"),
    "Brain": ("Science", "Psychology"),
    "Book Club": (),
    "Books About Books": ("Writing",),
    "British Literature": (),
    "Buddhism": ("Religion", "Spirituality"),
    "Canada": (),
    "Category Romance": ("Romance",),
    "Cats": ("Animals",),
    "Catholic": ("Religion",),
    "Chapter Books": ("Children's",),
    "Chess": ("Games",),
    "Chick Lit": ("Contemporary Romance", "Romance"),
    "Childrens": ("Children's",),
    "Christian": ("Religion",),
    "Christian Living": ("Religion", "Spirituality"),
    "Christian Non Fiction": ("Religion", "Nonfiction"),
    "Christianity": ("Religion",),
    "Chemistry": ("Science",),
    "Christmas": ("Holiday",),
    "Church": ("Religion",),
    "Cities": ("Travel",),
    "Civil War": ("History", "War"),
    "Classic Literature": ("Classics", "Fiction"),
    "Collections": ("Anthologies",),
    "College": ("Education",),
    "Comic Book": ("Comics",),
    "Comic Strips": ("Comics",),
    "Comics Manga": ("Comics", "Manga"),
    "Comix": ("Comics",),
    "Comedy": ("Humor",),
    "Combat": ("Action", "War"),
    "Communication": ("Language", "Business"),
    "Computers": ("Computer Science", "Technology"),
    "Cooking": ("Cooking", "Food and Drink"),
    "Cookbooks": ("Cooking", "Food and Drink"),
    "Crochet": ("Crafts",),
    "Counselling": ("Mental Health", "Psychology"),
    "Culinary": ("Cooking", "Food and Drink"),
    "Counting": ("Mathematics", "Children's"),
    "Couture": ("Fashion",),
    "Currency": ("Finance",),
    "Culture": (),
    "Cultural": (),
    "Cyberpunk": ("Cyberpunk", "Science Fiction"),
    "Dc Comics": ("Comics", "Superheroes"),
    "Demons": ("Horror", "Paranormal"),
    "Detective": ("Mystery", "Crime"),
    "Diary": ("Memoir",),
    "Dinosaurs": ("Animals", "Science"),
    "Doctor Who": ("Science Fiction",),
    "Dogs": ("Animals",),
    "Dragons": ("Fantasy",),
    "Drawing": ("Art",),
    "Dungeons and Dragons": ("Games", "Fantasy"),
    "Dystopia": ("Dystopian",),
    "Ecology": ("Environment", "Science"),
    "Engineering": ("Technology",),
    "Entrepreneurship": ("Business",),
    "Espionage": ("Thriller", "Crime"),
    "Erotica": ("Romance",),
    "Esoterica": ("Occult", "Spirituality"),
    "Ethnography": ("Anthropology",),
    "European History": ("History",),
    "European Literature": (),
    "Evolution": ("Science", "Biology"),
    "Fairy Tale Retellings": ("Fairy Tales", "Fantasy"),
    "Fairies": ("Fairy Tales", "Fantasy"),
    "Faith": ("Religion", "Spirituality"),
    "Family": ("Family",),
    "Fashion": ("Fashion",),
    "Feminism": ("Social Science",),
    "Field Guides": ("Reference", "Nature"),
    "Fitness": ("Health",),
    "Food": ("Food and Drink",),
    "Food Writing": ("Food and Drink", "Writing"),
    "Foodie": ("Food and Drink",),
    "Football": ("Sports",),
    "Folk Tales": ("Folklore", "Fairy Tales"),
    "France": (),
    "Gaming": ("Games",),
    "Gamebooks": ("Games",),
    "Geography": ("Travel", "Reference"),
    "Geology": ("Science",),
    "German Literature": (),
    "Ghosts": ("Ghosts", "Horror", "Paranormal"),
    "Gothic": ("Horror",),
    "Grad School": ("Education",),
    "Graphic Novels Comics": ("Graphic Novels", "Comics"),
    "Graphic Novels Manga": ("Graphic Novels", "Manga"),
    "Graphic Novels": ("Graphic Novels",),
    "Halloween": ("Holiday", "Horror"),
    "Harlequin": ("Romance",),
    "Harlequin Blaze": ("Romance",),
    "Harlequin Desire": ("Romance",),
    "Harlequin Presents": ("Romance",),
    "High Fantasy": ("High Fantasy", "Fantasy"),
    "Historical": ("History",),
    "Hinduism": ("Religion", "Spirituality"),
    "History Of Science": ("History", "Science"),
    "Holocaust": ("History", "War"),
    "Horses": ("Animals",),
    "Horticulture": ("Gardening",),
    "High School": ("Young Adult", "Education"),
    "Hqn": ("Romance",),
    "How To": ("Self Help", "Reference"),
    "Humanities": ("Nonfiction",),
    "Inspirational": ("Spirituality", "Self Help"),
    "International Relations": ("Politics",),
    "Islam": ("Religion",),
    "Journalism": ("Writing",),
    "Japan": (),
    "Japanese Literature": (),
    "Jewish": ("Religion",),
    "Judaica": ("Religion",),
    "Jazz": ("Music",),
    "Josei": ("Manga",),
    "Judaism": ("Religion",),
    "Juvenile": ("Children's",),
    "Kids": ("Children's",),
    "Knitting": ("Crafts",),
    "Language": ("Language",),
    "Labor": ("Business", "Social Science"),
    "Lds": ("Religion",),
    "Leadership": ("Leadership", "Business"),
    "Light Novel": ("Light Novel",),
    "Linguistics": ("Language",),
    "Literary Criticism": ("Writing",),
    "Literature": ("Literary Fiction",),
    "Library Science": ("Reference",),
    "Logic": ("Philosophy", "Mathematics"),
    "Love": ("Romance", "Relationships"),
    "Love Inspired": ("Christian Romance", "Romance"),
    "Love Inspired Suspense": ("Christian Romance", "Romantic Suspense"),
    "Lovecraftian": ("Horror",),
    "Magick": ("Occult",),
    "Magic": ("Magic", "Fantasy"),
    "Magical Realism": ("Fantasy", "Literary Fiction"),
    "Manga Romance": ("Manga", "Romance"),
    "Manhwa": ("Manga", "Comics"),
    "Marriage": ("Relationships", "Family"),
    "Martial Arts": ("Sports", "Action"),
    "Marvel": ("Comics", "Superheroes"),
    "Mathematics": ("Mathematics",),
    "Media Tie In": (),
    "Medical": ("Medicine", "Health"),
    "Medieval": ("History",),
    "Medieval History": ("History",),
    "Mental Health": ("Mental Health", "Health", "Psychology"),
    "Mental Illness": ("Mental Health", "Psychology"),
    "Metaphysics": ("Philosophy",),
    "Middle Grade": ("Middle Grade", "Children's"),
    "Military Fiction": ("War", "Historical Fiction"),
    "Military History": ("War", "History"),
    "Mills and Boon": ("Romance",),
    "Modern": ("Contemporary",),
    "Money": ("Finance",),
    "Monsters": ("Horror", "Fantasy"),
    "Mountaineering": ("Sports", "Nature"),
    "Murder Mystery": ("Mystery", "Crime"),
    "Mystery Thriller": ("Mystery", "Thriller"),
    "Natural History": ("Nature", "Science"),
    "Native Americans": ("History", "Social Science"),
    "Neuroscience": ("Science", "Psychology"),
    "Nordic Noir": ("Mystery", "Crime", "Thriller"),
    "Noir": ("Mystery", "Crime"),
    "New Age": ("Spirituality", "Occult"),
    "New Testament": ("Religion",),
    "Novella": ("Fiction",),
    "Novels": ("Fiction",),
    "Number": ("Mathematics",),
    "Nutrition": ("Health", "Food and Drink"),
    "Nurses": ("Medicine", "Health"),
    "Nursing": ("Medicine", "Health"),
    "Occult Detective": ("Occult", "Mystery"),
    "Old Testament": ("Religion",),
    "Origami": ("Crafts",),
    "Outdoors": ("Nature", "Travel"),
    "Paganism": ("Religion", "Spirituality"),
    "Paranormal Romance": ("Paranormal Romance", "Romance", "Paranormal"),
    "Personal Development": ("Personal Development", "Self Help"),
    "Personal Finance": ("Finance",),
    "Philosophy": ("Philosophy",),
    "Photography": ("Photography", "Art"),
    "Physics": ("Science",),
    "Picture Books": ("Picture Books", "Children's"),
    "Pirates": ("Adventure", "Historical Fiction"),
    "Plants": ("Nature", "Gardening"),
    "Plays": ("Plays", "Drama"),
    "Political Science": ("Politics",),
    "Pop Culture": (),
    "Popular Science": ("Popular Science", "Science"),
    "Prayer": ("Religion", "Spirituality"),
    "Productivity": ("Personal Development", "Business"),
    "Programming": ("Programming", "Computer Science"),
    "Presidents": ("Politics", "History"),
    "Regency": ("Historical Romance", "Romance"),
    "Psychoanalysis": ("Psychology",),
    "Psychology": ("Psychology",),
    "Quilting": ("Crafts",),
    "Race": ("Social Science",),
    "Realistic Fiction": ("Fiction", "Contemporary"),
    "Reference": ("Reference",),
    "Relationships": ("Relationships",),
    "Research": ("Reference",),
    "Retellings": ("Fairy Tales", "Fantasy"),
    "Role Playing Games": ("Games",),
    "Roman": ("Fiction",),
    "Railways": ("Technology",),
    "Russia": (),
    "School": (),
    "School Stories": ("Children's", "Young Adult"),
    "Science": ("Science",),
    "Sciences": ("Science",),
    "Self Help": ("Self Help",),
    "Seinen": ("Manga",),
    "Sequential Art": ("Comics", "Graphic Novels"),
    "Sewing": ("Crafts",),
    "Shapeshifters": ("Paranormal", "Fantasy"),
    "Shojo": ("Manga",),
    "Short Story Collection": ("Short Stories", "Anthologies"),
    "Shonen": ("Manga",),
    "Slice Of Life": ("Contemporary",),
    "Social Justice": ("Social Science", "Politics"),
    "Social Issues": ("Social Science",),
    "Social Movements": ("Social Science", "Politics"),
    "Social Work": ("Social Science",),
    "Software": ("Programming", "Technology"),
    "Space": ("Science Fiction", "Science"),
    "Sports and Games": ("Sports", "Games"),
    "Spy Thriller": ("Thriller", "Crime"),
    "Star Wars": ("Science Fiction",),
    "Storytime": ("Children's", "Picture Books"),
    "Sustainability": ("Environment",),
    "Superheroes": ("Superheroes", "Comics"),
    "Survival": ("Adventure",),
    "Sword and Sorcery": ("Fantasy",),
    "Terrorism": ("Politics", "Thriller"),
    "Technical": ("Technology",),
    "Tarot": ("Occult", "Spirituality"),
    "Teen": ("Young Adult",),
    "Teaching": ("Education",),
    "Textbooks": ("Education", "Reference"),
    "Theology": ("Religion",),
    "Theory": ("Philosophy",),
    "Transport": ("Technology",),
    "Trains": ("Technology",),
    "Travel": ("Travel",),
    "Tv": ("Film",),
    "Urban Planning": ("Architecture", "Design"),
    "Video Games": ("Games",),
    "Utopia": ("Speculative Fiction",),
    "Vegan": ("Food and Drink", "Health"),
    "Vegetarian": ("Food and Drink", "Health"),
    "War": ("War",),
    "Wicca": ("Occult", "Spirituality"),
    "Witchcraft": ("Occult", "Witches"),
    "Werewolves": ("Paranormal", "Fantasy"),
    "Wine": ("Food and Drink",),
    "X Men": ("Comics", "Superheroes"),
    "Womens": (),
    "Womens Fiction": ("Fiction", "Contemporary"),
    "World History": ("History",),
    "World Of Darkness": ("Games", "Horror"),
    "World War I": ("War", "History"),
    "World War II": ("War", "History"),
    "Writing": ("Writing",),
    "Young Adult Fantasy": ("Young Adult", "Fantasy"),
    "Zen": ("Religion", "Spirituality"),
}

MOJIBAKE_MARKERS = (
    "\ufffd",
    "ï¿½",
    "Ã",
    "Â",
    "â€",
    "â€™",
    "â€œ",
    "â€\x9d",
    "â€“",
    "â€”",
    "â€¦",
    "â„¢",
    "Ð",
    "Ñ",
    "Ø",
    "Ù",
    "Ú",
    "×",
)
MOJIBAKE_PREFIXES = frozenset("àáãäåæçèéìïðÄÅÈÊÏ")
MOJIBAKE_FOLLOWERS = frozenset(
    "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f"
    "\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f"
    "¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿"
    "€‚ƒ„…†‡ˆ‰Š‹ŒŽ™š›œžŸ"
)


@dataclass(frozen=True)
class CleanupPlan:
    strange_book_ids: list[int]
    strange_book_samples: list[tuple[int, str, str]]
    source_genres_to_remove: list[str]
    planned_bookgenre_adds: int
    planned_bookgenre_drops: int
    books_without_clean_genres: int


def has_mojibake(value: str) -> bool:
    if not value:
        return False
    if any(marker in value for marker in MOJIBAKE_MARKERS):
        return True
    if any(ord(char) < 32 and char not in "\t\n\r" for char in value):
        return True
    for index, char in enumerate(value[:-1]):
        if char in MOJIBAKE_PREFIXES and value[index + 1] in MOJIBAKE_FOLLOWERS:
            return True
    return False


CANONICAL_BY_NORMALIZED = {normalize_label(name): name for name in CANONICAL_GENRES}
ALIASES_BY_NORMALIZED = {normalize_label(name): targets for name, targets in GENRE_ALIASES.items()}


def target_names_for_genre(name: str) -> tuple[str, ...]:
    normalized = normalize_label(name)
    if normalized in CANONICAL_BY_NORMALIZED:
        return (CANONICAL_BY_NORMALIZED[normalized],)
    if normalized in ALIASES_BY_NORMALIZED:
        return ALIASES_BY_NORMALIZED[normalized]
    if normalized.startswith("m m "):
        targets = ["LGBTQ"]
        if normalized.endswith("romance"):
            targets.append("Romance")
        if normalized.endswith("fantasy"):
            targets.append("Fantasy")
        if normalized.endswith("mystery"):
            targets.append("Mystery")
        if normalized.endswith("science fiction"):
            targets.append("Science Fiction")
        return tuple(targets)
    if normalized.startswith("young adult "):
        targets = ["Young Adult"]
        for suffix, target in (
            ("fantasy", "Fantasy"),
            ("romance", "Romance"),
            ("science fiction", "Science Fiction"),
            ("mystery", "Mystery"),
        ):
            if normalized.endswith(suffix):
                targets.append(target)
        return tuple(targets)
    suffix_targets = (
        (" history", ("History",)),
        (" romance", ("Romance",)),
        (" fiction", ("Fiction",)),
        (" mystery", ("Mystery",)),
        (" fantasy", ("Fantasy",)),
        (" thriller", ("Thriller",)),
    )
    for suffix, suffix_target_values in suffix_targets:
        if normalized.endswith(suffix):
            return suffix_target_values
    if normalized.endswith(" literature"):
        return ()
    return ()


class Command(BaseCommand):
    help = "Archive malformed catalog books and collapse imported tags into a curated genre taxonomy."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Apply the cleanup. Omit for a dry run.")
        parser.add_argument(
            "--skip-repair",
            action="store_true",
            help="Skip denormalized counter/label repair after applying changes.",
        )
        parser.add_argument(
            "--skip-search-rebuild",
            action="store_true",
            help="Skip autocomplete/search-label rebuild after applying changes.",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        plan = self.build_plan()
        self.print_plan(plan=plan, apply=apply)

        if not apply:
            self.stdout.write(self.style.WARNING("Dry run only. Re-run with --apply to modify the database."))
            return

        with transaction.atomic():
            now = timezone.now()
            archived_books = self.archive_strange_books(book_ids=plan.strange_book_ids, now=now)
            related_archives = self.archive_related_rows(book_ids=plan.strange_book_ids, now=now)
            canonical_genres = self.ensure_canonical_genres()
            genre_changes = self.rewrite_genre_links(canonical_genres=canonical_genres)
            deleted_genres = self.delete_noncanonical_genres(canonical_genres=canonical_genres)
            self.configure_featured_genres(canonical_genres=canonical_genres)

        self.stdout.write(self.style.SUCCESS(f"Archived {archived_books} malformed books."))
        for label, count in related_archives.items():
            self.stdout.write(f"Archived/deactivated {count} {label}.")
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {genre_changes['created']} clean book-genre links, "
                f"deleted {genre_changes['deleted']} imported tag links, "
                f"and removed {deleted_genres} noncanonical genres."
            )
        )

        if not options["skip_repair"]:
            repair_counts = self.fast_repair_denormalized_data()
            deleted_authors = self.delete_inactive_bad_authors()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Repaired denormalized data: {repair_counts}. Removed {deleted_authors} bad inactive authors."
                )
            )

        if not options["skip_search_rebuild"]:
            autocomplete_terms = self.fast_rebuild_search_data()
            self.stdout.write(self.style.SUCCESS(f"Rebuilt search data with {autocomplete_terms} autocomplete terms."))

    def build_plan(self) -> CleanupPlan:
        strange_book_ids: list[int] = []
        strange_book_samples: list[tuple[int, str, str]] = []
        for book in Book.objects.filter(is_archived=False).only("id", "title", "subtitle", "author_names").iterator():
            bad_fields = [
                field
                for field in ("title", "subtitle", "author_names")
                if has_mojibake(str(getattr(book, field) or ""))
            ]
            if not bad_fields:
                continue
            strange_book_ids.append(book.id)
            if len(strange_book_samples) < 12:
                strange_book_samples.append((book.id, book.title, ", ".join(bad_fields)))

        book_targets: dict[int, set[str]] = defaultdict(set)
        planned_adds = 0
        planned_drops = 0
        source_genres_to_remove = []

        for genre in Genre.objects.only("id", "name").iterator():
            targets = target_names_for_genre(genre.name)
            if not targets:
                source_genres_to_remove.append(genre.name)

        for link in BookGenre.objects.select_related("genre").only(
            "id",
            "book_id",
            "genre_id",
            "genre__name",
        ).iterator():
            targets = target_names_for_genre(link.genre.name)
            if not targets:
                planned_drops += 1
                continue
            book_targets[link.book_id].update(targets)
            if len(targets) > 1 or normalize_label(link.genre.name) not in CANONICAL_BY_NORMALIZED:
                planned_drops += 1
                planned_adds += len(targets)

        visible_book_ids = set(Book.objects.filter(is_archived=False).values_list("id", flat=True))
        books_without_clean_genres = len(visible_book_ids - set(book_targets))

        return CleanupPlan(
            strange_book_ids=strange_book_ids,
            strange_book_samples=strange_book_samples,
            source_genres_to_remove=sorted(source_genres_to_remove),
            planned_bookgenre_adds=planned_adds,
            planned_bookgenre_drops=planned_drops,
            books_without_clean_genres=books_without_clean_genres,
        )

    def print_plan(self, *, plan: CleanupPlan, apply: bool) -> None:
        mode = "APPLY" if apply else "DRY RUN"
        self.stdout.write(self.style.MIGRATE_HEADING(f"Catalog cleanup plan ({mode})"))
        self.stdout.write(f"Malformed visible books to archive: {len(plan.strange_book_ids)}")
        for book_id, title, fields in plan.strange_book_samples:
            self.stdout.write(f"  - {book_id}: {title!r} ({fields})")
        self.stdout.write(f"Genres to keep/create: {len(CANONICAL_GENRES)}")
        self.stdout.write(f"Imported genre rows to remove: {len(plan.source_genres_to_remove)}")
        for name in plan.source_genres_to_remove[:20]:
            self.stdout.write(f"  - {name}")
        self.stdout.write(f"Book-genre links to add or merge: {plan.planned_bookgenre_adds}")
        self.stdout.write(f"Imported book-genre links to drop: {plan.planned_bookgenre_drops}")
        self.stdout.write(f"Visible books with no clean genre after rewrite: {plan.books_without_clean_genres}")

    def archive_strange_books(self, *, book_ids: list[int], now) -> int:
        if not book_ids:
            return 0
        return Book.objects.filter(id__in=book_ids, is_archived=False).update(
            is_archived=True,
            archived_at=now,
            archive_reason=ARCHIVE_REASON,
            updated_at=now,
        )

    def archive_related_rows(self, *, book_ids: list[int], now) -> dict[str, int]:
        if not book_ids:
            return {
                "collection items": 0,
                "reading progress rows": 0,
                "ratings": 0,
                "reviews": 0,
                "catalog recommendations": 0,
                "user recommendations": 0,
            }
        return {
            "collection items": CollectionBook.objects.filter(book_id__in=book_ids, is_archived=False).update(
                is_archived=True,
                archived_at=now,
                archive_reason=ARCHIVE_REASON,
                updated_at=now,
            ),
            "reading progress rows": ReadingProgress.objects.filter(book_id__in=book_ids, is_archived=False).update(
                is_archived=True,
                archived_at=now,
                archive_reason=ARCHIVE_REASON,
                updated_at=now,
            ),
            "ratings": Rating.objects.filter(book_id__in=book_ids, is_archived=False).update(
                is_archived=True,
                archived_at=now,
                archive_reason=ARCHIVE_REASON,
                updated_at=now,
            ),
            "reviews": Review.objects.filter(book_id__in=book_ids, is_archived=False).update(
                is_archived=True,
                archived_at=now,
                archive_reason=ARCHIVE_REASON,
                updated_at=now,
            ),
            "catalog recommendations": CatalogRecommendation.objects.filter(
                book_id__in=book_ids,
                is_active=True,
            ).update(is_active=False, updated_at=now),
            "user recommendations": UserRecommendation.objects.filter(book_id__in=book_ids, is_active=True).update(
                is_active=False,
                updated_at=now,
            ),
        }

    def ensure_canonical_genres(self) -> dict[str, Genre]:
        existing = list(Genre.objects.all())
        by_normalized = {normalize_label(genre.name): genre for genre in existing}
        reusable = {
            normalize_label(alias): canonical
            for canonical, aliases in REUSABLE_ALIASES.items()
            for alias in aliases
        }
        canonical_genres: dict[str, Genre] = {}

        for name in CANONICAL_GENRES:
            normalized = normalize_label(name)
            genre = by_normalized.get(normalized)
            if genre is None:
                reusable_name = next(
                    (
                        alias_normalized
                        for alias_normalized, canonical in reusable.items()
                        if canonical == name and alias_normalized in by_normalized
                    ),
                    None,
                )
                genre = by_normalized[reusable_name] if reusable_name else None
            if genre is None:
                genre = Genre.objects.create(
                    name=name,
                    normalized_name=normalize_label(name),
                    slug=unique_slug(model=Genre, value=name, max_length=140),
                )
            elif genre.name != name or genre.normalized_name != normalize_label(name):
                genre.name = name
                genre.normalized_name = normalize_label(name)
                genre.slug = unique_slug(model=Genre, value=name, max_length=140, instance_id=genre.id)
                genre.parent = None
                genre.save(update_fields=["name", "normalized_name", "slug", "parent", "updated_at"])
            canonical_genres[name] = genre
            by_normalized[normalized] = genre

        return canonical_genres

    def rewrite_genre_links(self, *, canonical_genres: dict[str, Genre]) -> dict[str, int]:
        canonical_ids = {genre.id for genre in canonical_genres.values()}
        existing_pairs = set(BookGenre.objects.values_list("book_id", "genre_id"))
        links_to_create: list[BookGenre] = []
        link_ids_to_delete: list[int] = []

        for link in BookGenre.objects.select_related("genre").only(
            "id",
            "book_id",
            "genre_id",
            "position",
            "is_primary",
            "genre__name",
        ).iterator(chunk_size=5000):
            target_genre_ids = [
                canonical_genres[name].id
                for name in target_names_for_genre(link.genre.name)
                if name in canonical_genres
            ]
            if not target_genre_ids:
                link_ids_to_delete.append(link.id)
                continue
            if link.genre_id not in canonical_ids or set(target_genre_ids) != {link.genre_id}:
                link_ids_to_delete.append(link.id)
            for offset, target_id in enumerate(target_genre_ids):
                pair = (link.book_id, target_id)
                if pair in existing_pairs:
                    continue
                existing_pairs.add(pair)
                links_to_create.append(
                    BookGenre(
                        book_id=link.book_id,
                        genre_id=target_id,
                        position=link.position + offset,
                        is_primary=link.is_primary and offset == 0,
                    )
                )

        created = 0
        for start in range(0, len(links_to_create), 5000):
            batch = links_to_create[start : start + 5000]
            BookGenre.objects.bulk_create(batch, ignore_conflicts=True)
            created += len(batch)

        deleted = 0
        for start in range(0, len(link_ids_to_delete), 5000):
            batch_ids = link_ids_to_delete[start : start + 5000]
            deleted += self.raw_delete_bookgenre_ids(batch_ids=batch_ids)

        return {"created": created, "deleted": deleted}

    def raw_delete_bookgenre_ids(self, *, batch_ids: list[int]) -> int:
        table_name = connection.ops.quote_name(BookGenre._meta.db_table)
        pk_column = BookGenre._meta.pk.column
        if pk_column is None:
            raise RuntimeError("BookGenre primary key column is not configured.")
        column_name = connection.ops.quote_name(pk_column)
        placeholders = ", ".join(["%s"] * len(batch_ids))
        with connection.cursor() as cursor:
            cursor.execute(f"DELETE FROM {table_name} WHERE {column_name} IN ({placeholders})", batch_ids)
            return cursor.rowcount

    def delete_noncanonical_genres(self, *, canonical_genres: dict[str, Genre]) -> int:
        canonical_ids = {genre.id for genre in canonical_genres.values()}
        genre_content_type = ContentType.objects.get_for_model(Genre)
        stale_genre_ids = list(Genre.objects.exclude(id__in=canonical_ids).values_list("id", flat=True))
        SearchAutocompleteTerm.objects.filter(
            target_content_type=genre_content_type,
            target_object_id__in=stale_genre_ids,
        ).delete()
        return Genre.objects.filter(id__in=stale_genre_ids).delete()[0]

    def configure_featured_genres(self, *, canonical_genres: dict[str, Genre]) -> None:
        Genre.objects.filter(id__in=[genre.id for genre in canonical_genres.values()]).update(
            is_featured=False,
            carousel_rank=None,
        )
        for index, name in enumerate(FEATURED_GENRES, start=1):
            genre = canonical_genres[name]
            Genre.objects.filter(id=genre.id).update(is_featured=True, carousel_rank=index)

    def fast_repair_denormalized_data(self) -> dict[str, int]:
        tables = {
            "author": self.quote_table(Author),
            "book": self.quote_table(Book),
            "book_author": self.quote_table(BookAuthor),
            "book_genre": self.quote_table(BookGenre),
            "collection": self.quote_table(ReadingCollection),
            "collection_book": self.quote_table(CollectionBook),
            "genre": self.quote_table(Genre),
            "progress": self.quote_table(ReadingProgress),
            "rating": self.quote_table(Rating),
            "review": self.quote_table(Review),
        }
        counts: dict[str, int] = {}
        with connection.cursor() as cursor:
            cursor.execute("SET SESSION group_concat_max_len = 65535")
            cursor.execute(
                f"""
                UPDATE {tables["author"]} author
                LEFT JOIN (
                    SELECT book_author.author_id, COUNT(DISTINCT book_author.book_id) AS books_count
                    FROM {tables["book_author"]} book_author
                    INNER JOIN {tables["book"]} book
                        ON book.id = book_author.book_id
                    WHERE book.is_archived = 0 AND book.is_public = 1
                    GROUP BY book_author.author_id
                ) counts ON counts.author_id = author.id
                SET author.books_count = COALESCE(counts.books_count, 0),
                    author.is_active = IF(COALESCE(counts.books_count, 0) = 0, 0, author.is_active),
                    author.updated_at = NOW()
                """
            )
            counts["authors"] = cursor.rowcount

            cursor.execute(
                f"""
                UPDATE {tables["genre"]} genre
                LEFT JOIN (
                    SELECT book_genre.genre_id, COUNT(DISTINCT book_genre.book_id) AS books_count
                    FROM {tables["book_genre"]} book_genre
                    INNER JOIN {tables["book"]} book
                        ON book.id = book_genre.book_id
                    WHERE book.is_archived = 0 AND book.is_public = 1
                    GROUP BY book_genre.genre_id
                ) counts ON counts.genre_id = genre.id
                SET genre.books_count = COALESCE(counts.books_count, 0),
                    genre.updated_at = NOW()
                """
            )
            counts["genres"] = cursor.rowcount

            cursor.execute(
                f"""
                UPDATE {tables["book"]} book
                LEFT JOIN (
                    SELECT book_author.book_id,
                           GROUP_CONCAT(author.name ORDER BY book_author.position, author.name SEPARATOR ', ')
                               AS author_names
                    FROM {tables["book_author"]} book_author
                    INNER JOIN {tables["author"]} author
                        ON author.id = book_author.author_id
                    GROUP BY book_author.book_id
                ) authors ON authors.book_id = book.id
                LEFT JOIN (
                    SELECT book_genre.book_id,
                           GROUP_CONCAT(genre.name ORDER BY book_genre.position, genre.name SEPARATOR ', ')
                               AS genre_labels
                    FROM {tables["book_genre"]} book_genre
                    INNER JOIN {tables["genre"]} genre
                        ON genre.id = book_genre.genre_id
                    GROUP BY book_genre.book_id
                ) genres ON genres.book_id = book.id
                SET book.author_names = COALESCE(authors.author_names, ''),
                    book.genre_labels = COALESCE(genres.genre_labels, ''),
                    book.updated_at = NOW()
                """
            )
            counts["book_labels"] = cursor.rowcount

            cursor.execute(
                f"""
                UPDATE {tables["book"]} book
                LEFT JOIN (
                    SELECT book_id, ROUND(AVG(value), 2) AS average_rating, COUNT(*) AS rating_count
                    FROM {tables["rating"]}
                    WHERE is_archived = 0
                    GROUP BY book_id
                ) ratings ON ratings.book_id = book.id
                LEFT JOIN (
                    SELECT book_id, COUNT(*) AS review_count
                    FROM {tables["review"]}
                    WHERE is_archived = 0
                    GROUP BY book_id
                ) reviews ON reviews.book_id = book.id
                LEFT JOIN (
                    SELECT book_id, COUNT(*) AS collection_count
                    FROM {tables["collection_book"]}
                    WHERE is_archived = 0
                    GROUP BY book_id
                ) collections ON collections.book_id = book.id
                LEFT JOIN (
                    SELECT book_id, COUNT(*) AS read_count
                    FROM {tables["progress"]}
                    WHERE is_archived = 0 AND status = %s
                    GROUP BY book_id
                ) progress ON progress.book_id = book.id
                SET book.average_rating = COALESCE(ratings.average_rating, 0),
                    book.rating_count = COALESCE(ratings.rating_count, 0),
                    book.review_count = COALESCE(reviews.review_count, 0),
                    book.collection_count = COALESCE(collections.collection_count, 0),
                    book.read_count = COALESCE(progress.read_count, 0),
                    book.updated_at = NOW()
                """,
                [ReadingListType.DONE],
            )
            counts["book_counts"] = cursor.rowcount

            cursor.execute(
                f"""
                UPDATE {tables["collection"]} collection
                LEFT JOIN (
                    SELECT collection_id, COUNT(*) AS item_count, MAX(added_at) AS last_book_added_at
                    FROM {tables["collection_book"]}
                    WHERE is_archived = 0
                    GROUP BY collection_id
                ) items ON items.collection_id = collection.id
                SET collection.item_count = COALESCE(items.item_count, 0),
                    collection.last_book_added_at = items.last_book_added_at,
                    collection.updated_at = NOW()
                """
            )
            counts["collections"] = cursor.rowcount
        return counts

    def fast_rebuild_search_data(self) -> int:
        SearchAutocompleteTerm.objects.all().delete()
        now = timezone.now()
        content_types = {
            "author": ContentType.objects.get_for_model(Author),
            "book": ContentType.objects.get_for_model(Book),
            "genre": ContentType.objects.get_for_model(Genre),
        }
        total = 0
        batch: list[SearchAutocompleteTerm] = []

        def flush() -> None:
            nonlocal total, batch
            if not batch:
                return
            SearchAutocompleteTerm.objects.bulk_create(batch, ignore_conflicts=True)
            total += len(batch)
            batch = []

        def add_term(term: str | None, term_type: str, content_type, object_id: int, weight: int) -> None:
            if not term:
                return
            batch.append(
                SearchAutocompleteTerm(
                    term=term,
                    term_type=term_type,
                    target_content_type=content_type,
                    target_object_id=object_id,
                    weight=max(int(weight or 0), 0),
                    last_seen_at=now,
                    is_active=True,
                )
            )
            if len(batch) >= 5000:
                flush()

        for book in Book.objects.filter(is_public=True, is_archived=False).only(
            "id",
            "title",
            "isbn_13",
            "isbn_10",
            "rating_count",
        ).iterator(chunk_size=5000):
            add_term(
                book.title,
                SearchAutocompleteTerm.TermType.BOOK,
                content_types["book"],
                book.id,
                book.rating_count,
            )
            add_term(
                book.isbn_13,
                SearchAutocompleteTerm.TermType.ISBN,
                content_types["book"],
                book.id,
                book.rating_count,
            )
            add_term(
                book.isbn_10,
                SearchAutocompleteTerm.TermType.ISBN,
                content_types["book"],
                book.id,
                book.rating_count,
            )

        for author in Author.objects.filter(is_active=True).only("id", "name", "books_count").iterator(
            chunk_size=5000
        ):
            add_term(
                author.name,
                SearchAutocompleteTerm.TermType.AUTHOR,
                content_types["author"],
                author.id,
                author.books_count,
            )

        for genre in Genre.objects.only("id", "name", "books_count").iterator(chunk_size=5000):
            add_term(
                genre.name,
                SearchAutocompleteTerm.TermType.GENRE,
                content_types["genre"],
                genre.id,
                genre.books_count,
            )

        flush()
        SearchIndexStatus.objects.update_or_create(
            name=SearchIndexStatus.IndexName.BOOKS,
            defaults={
                "status": SearchIndexStatus.Status.READY,
                "last_rebuilt_at": now,
                "document_count": Book.objects.filter(is_public=True, is_archived=False).count(),
                "error_message": "",
            },
        )
        SearchIndexStatus.objects.update_or_create(
            name=SearchIndexStatus.IndexName.AUTHORS,
            defaults={
                "status": SearchIndexStatus.Status.READY,
                "last_rebuilt_at": now,
                "document_count": Author.objects.filter(is_active=True).count(),
                "error_message": "",
            },
        )
        SearchIndexStatus.objects.update_or_create(
            name=SearchIndexStatus.IndexName.GENRES,
            defaults={
                "status": SearchIndexStatus.Status.READY,
                "last_rebuilt_at": now,
                "document_count": Genre.objects.count(),
                "error_message": "",
            },
        )
        return total

    def delete_inactive_bad_authors(self) -> int:
        bad_author_ids = [
            author.id
            for author in Author.objects.filter(is_active=False, books_count=0).only("id", "name").iterator()
            if has_mojibake(author.name)
        ]
        if not bad_author_ids:
            return 0

        author_content_type = ContentType.objects.get_for_model(Author)
        SearchAutocompleteTerm.objects.filter(
            target_content_type=author_content_type,
            target_object_id__in=bad_author_ids,
        ).delete()

        deleted = 0
        for start in range(0, len(bad_author_ids), 5000):
            batch_ids = bad_author_ids[start : start + 5000]
            self.raw_delete_related_author_rows(batch_ids=batch_ids)
            deleted += self.raw_delete_author_ids(batch_ids=batch_ids)
        return deleted

    def raw_delete_related_author_rows(self, *, batch_ids: list[int]) -> None:
        placeholders = ", ".join(["%s"] * len(batch_ids))
        related_tables = (
            (self.quote_table(BookAuthor), "author_id"),
            (self.quote_table(AuthorLike), "author_id"),
        )
        with connection.cursor() as cursor:
            for table_name, column in related_tables:
                column_name = connection.ops.quote_name(column)
                cursor.execute(f"DELETE FROM {table_name} WHERE {column_name} IN ({placeholders})", batch_ids)

    def raw_delete_author_ids(self, *, batch_ids: list[int]) -> int:
        table_name = self.quote_table(Author)
        pk_column = Author._meta.pk.column
        if pk_column is None:
            raise RuntimeError("Author primary key column is not configured.")
        column_name = connection.ops.quote_name(pk_column)
        placeholders = ", ".join(["%s"] * len(batch_ids))
        with connection.cursor() as cursor:
            cursor.execute(f"DELETE FROM {table_name} WHERE {column_name} IN ({placeholders})", batch_ids)
            return cursor.rowcount

    def quote_table(self, model) -> str:
        return connection.ops.quote_name(model._meta.db_table)
