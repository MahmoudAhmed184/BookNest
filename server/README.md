# BookNest Backend

BookNest backend is a Django 6 REST API for a book discovery and reading social platform. It exposes versioned HTTP endpoints under `/api/v1/` using Django REST Framework, serves OpenAPI documentation with drf-spectacular, stores application data in MariaDB through the Django ORM and `mysqlclient`, uses Redis for cache and Celery broker/result storage, uses Cloudinary for media files, calls OpenLibrary and Google Books for catalog enrichment, and is intended to be called by the BookNest web client and by operational/admin users.

## Tech Stack

Versions below are resolved from `uv.lock`; dependency groups and runtime constraints are declared in `pyproject.toml`.

| Component | Package or image | Pinned version | Role |
|---|---:|---:|---|
| Runtime | Python | 3.14.4 | Required interpreter version from `.python-version` and `requires-python` |
| Web framework and ORM | `django` | 6.0.5 | HTTP framework, settings, migrations, ORM, admin, auth foundation |
| API framework | `djangorestframework` | 3.17.1 | Generic API views, serializers, permissions, throttling, pagination |
| API schema | `drf-spectacular` | 0.29.0 | OpenAPI 3.1 schema, Swagger UI, ReDoc |
| Authentication | `dj-rest-auth` | 7.2.0 | Login, logout, registration, password reset, JWT cookie support |
| Account flows | `django-allauth` | 65.16.1 | Email-first registration, account adapter, auth backend |
| JWT | `djangorestframework-simplejwt` | 5.5.1 | HS512 access/refresh tokens, refresh rotation, blacklist app |
| Database driver | `mysqlclient` | 2.2.8 | Django MySQL/MariaDB adapter |
| Database service | `mariadb` Docker image | 11.8 | Compose database service |
| Cache backend | `django-redis` | 6.0.0 | Django cache backend when Redis cache is enabled |
| Redis client | `redis` | 7.4.0 | Redis protocol client used by Django/Celery dependencies |
| Redis service | `redis` Docker image | 7-alpine | Compose cache and Celery broker/result service |
| Task queue | `celery` | 5.6.3 | Async recommendation and catalog integration tasks |
| WSGI server | `gunicorn` | 25.3.0 | Production container process |
| Static files | `whitenoise` | 6.12.0 | Production static file serving with compressed manifest storage |
| CORS | `django-cors-headers` | 4.9.0 | CORS middleware and origin allow-list |
| Media storage | `cloudinary` | 1.44.2 | Cloudinary API client and uploader |
| Media storage adapter | `django-cloudinary-storage` | 0.3.0 | Django storage backend for Cloudinary media |
| Image validation | `pillow` | 12.2.0 | ImageField/image upload support |
| HTTP client | `requests` | 2.33.1 | OpenLibrary and Google Books API calls |
| Data processing | `pandas` | 3.0.2 | Recommendation model training dataframes |
| Environment loading | `python-dotenv` | 1.2.2 | Loads `.env` in `config/settings/base.py` |
| Developer debugger | `debugpy` | 1.8.20 | Dev dependency |
| Interactive shell | `ipython` | 9.13.0 | Dev dependency |
| Linting/formatting | `ruff` | 0.15.12 | Static linting and formatting |
| Type checking | `mypy` | 1.20.2 | Static type checks |
| Django typing | `django-stubs` | 6.0.3 | Django mypy plugin and stubs |
| Test runner | `pytest` | 9.0.3 | Test execution |
| Django pytest integration | `pytest-django` | 4.12.0 | Django settings/database integration for pytest |
| Coverage | `coverage` | 7.13.5 | Test coverage measurement |
| Docker dependency manager | `uv` Docker binary | 0.11.3 | Dependency sync in the Dockerfile |

## Architecture Overview

The backend is a Django modular monolith. There is no `src/` directory; the service root is `server/`, with Django project configuration in `config/` and domain apps in `apps/`.

```text
server/
  manage.py
  pyproject.toml
  uv.lock
  Dockerfile
  docker-compose.yml
  config/
    urls.py
    celery.py
    asgi.py
    wsgi.py
    settings/
      base.py
      development.py
      production.py
      testing.py
  apps/
    common/
    users/
    books/
    reviews/
    collections/
    social/
    notifications/
    recommendations/
    search/
    integrations/
    operations/
```

| Layer/module | Responsibility | Pattern and interactions |
|---|---|---|
| `config/settings/*.py` | Runtime settings for base, development, production, and tests | Settings-module split. `base.py` defines installed apps, REST framework defaults, JWT, MariaDB, Cloudinary, Redis cache, Celery, logging, and schema settings. `development.py` relaxes local security and can use in-memory cache. `production.py` requires core secrets and enables secure cookies/HSTS/static manifest storage. `testing.py` uses in-memory SQLite by default and eager Celery tasks. |
| `config/urls.py` | Top-level URL routing | Mounts admin, schema/docs, and every app URLconf under `/api/v1/`. |
| `config/celery.py` | Celery application and periodic schedule | Autodiscovers app task modules. Schedules `apps.integrations.tasks.sync_external_books` daily. |
| `apps/common/` | Shared primitives | Abstract `TimeStampedModel` and `SoftDeleteModel`; page-number and cursor pagination classes used by domain views. |
| `apps/users/` | Custom user, profile, preferences, profile media, schema auth extension | Django custom user model plus profile/preference resources. Uses serializers for input/output, selectors for read queries and privacy checks, services for default records and Cloudinary uploads, signals for default preferences/default collections, and middleware requiring authenticated users to create a profile before protected feature access. |
| `apps/books/` | Catalog, authors, genres, book relationships, trend snapshots | Catalog domain. Views are thin DRF generic views, selectors build filtered querysets, services maintain slugs, many-to-many through rows, denormalized labels, and counters. Writes to catalog resources are staff/admin-only except author likes. |
| `apps/reviews/` | Ratings, reviews, and review votes | Owner-scoped write API. Services update aggregate book rating/review/vote counts. Signals keep denormalized counts synchronized. |
| `apps/collections/` | Reading collections, collection items, and reading progress | Owner-scoped shelves and progress tracking. Services create default shelves, add/remove collection books, and maintain collection/book counters. |
| `apps/social/` | Follows and activity feed | Follow relationships and generic feed events. Services create follow rows and feed events; signals create feed events from ratings, reviews, collection creation, and collection-book additions. |
| `apps/notifications/` | In-app notifications | Generic-foreign-key notification records. Signals create welcome, follow, review, rating, and review-vote notifications according to user preferences. Services mark read/unread and soft-delete notifications. |
| `apps/recommendations/` | Personalized and catalog recommendations | Lightweight pickleable recommendation engine based on smoothed item scores. Services train/load artifacts under `MEDIA_ROOT/recommendation_models`, generate user recommendations, refresh catalog recommendations, and execute `RecommendationRun` rows. Celery tasks enqueue or synchronously fall back for recommendation runs when the Redis broker is unreachable. |
| `apps/search/` | Book search, autocomplete, related-book suggestions, search logs | Search is implemented with ORM filters and denormalized book fields, plus a MariaDB full-text index on `Book`. Services log queries, rebuild autocomplete terms, and optionally enqueue external enrichment when local results are empty. |
| `apps/integrations/` | External catalog sources and enrichment | Stores provider/source metadata, external IDs, fetched records, enrichment requests, sync runs, and sync state. Services call OpenLibrary and Google Books with `requests`, normalize records, and merge them into local books/authors/genres. |
| `apps/operations/` | Operational task logs | Stores task IDs, task types, statuses, timestamps, and errors for Celery/operational workflows. |
| `*/migrations/` | Database schema history | Django migrations for every app. Some migrations contain manual MariaDB repair logic for legacy schemas. |
| `*/tests/` | Automated tests | App-local Django `TestCase` and DRF `APITestCase` tests, executed through pytest/pytest-django. |
| `*/management/commands/` | Operational CLI commands | Catalog cleanup, integration initialization, search rebuild, recommendation training/generation/export, catalog recommendation refresh, and denormalized data repair. |

## Data Model

The database engine is `django.db.backends.mysql` with `mysqlclient`; Compose runs MariaDB 11.8. Tests use in-memory SQLite unless `USE_MYSQL_TEST_DB=True`. Schema definitions are Django models under `apps/*/models.py`; migrations are under `apps/*/migrations/`.

| Entity/table | Purpose | Key fields | Relationships |
|---|---|---|---|
| `TimeStampedModel` | Abstract base for created/updated timestamps | `created_at`, `updated_at` | Inherited by most concrete models |
| `SoftDeleteModel` | Abstract archival base | `is_archived`, `archived_at`, `archive_reason` | Inherited by books, ratings, reviews, collections, collection items, progress |
| `users.User` | Custom email-login user | `email`, names, `display_name`, staff/active flags, auth timestamps | One profile, one preference row, owns ratings, reviews, collections, follows, notifications, recommendations |
| `users.Profile` | Public/private reader profile | `handle`, `bio`, `profile_type`, Cloudinary `picture`, counters, completion fields | One-to-one `User`; many-to-many `Genre` through `ProfileInterest`; has social links |
| `users.UserPreference` | User privacy and feature preferences | notification toggles, `profile_public`, `show_ratings_publicly`, recommendation/search/enrichment flags, timezone | One-to-one `User` |
| `users.ProfileInterest` | Weighted genre interest | `profile`, `genre`, `weight` | Unique profile/genre pair |
| `users.UserSocialLink` | Profile external/social links | `platform`, `url`, `label` | Belongs to `Profile`; unique profile/platform pair |
| `books.Author` | Catalog author | names, slug, bio, Cloudinary photo, source, counts, active flag | Many books through `BookAuthor`; liked by users through `AuthorLike` |
| `books.AuthorLike` | User author like | `user`, `author` | Unique user/author pair |
| `books.Genre` | Catalog genre/taxonomy node | names, slug, parent, featured/rank, book count | Self-parent; many books through `BookGenre`; profile interests |
| `books.Book` | Main catalog item | title/subtitle, slug, ISBNs, cover, publisher/date/year, language, source, ratings/counters, denormalized author/genre labels, visibility/archive flags | Many authors through `BookAuthor`, genres through `BookGenre`, related books through `RelatedBook`; referenced by reviews, collections, search, recommendations, integrations |
| `books.BookAuthor` | Ordered book-author join | `book`, `author`, `role`, `position`, note | Unique book/author/role |
| `books.BookGenre` | Ordered book-genre join | `book`, `genre`, `is_primary`, `position` | Unique book/genre |
| `books.RelatedBook` | Directed book relationship | `from_book`, `to_book`, `relation_type`, `score`, source | Prevents self-links; unique by from/to/type |
| `books.BookTrendSnapshot` | Periodic catalog trend metrics | `book`, `period`, `metric_date`, counts, `score` | Unique book/period/date |
| `reviews.Rating` | User rating for a book | `user`, `book`, `value`, `rated_at`, archive fields | Unique user/book; updates book rating stats |
| `reviews.Review` | User text review | `user`, `book`, optional `rating`, title/body, spoiler/edit flags, vote counts, score | Unique user/book; one optional rating; has votes |
| `reviews.ReviewVote` | User vote on review | `user`, `review`, `vote_type` | Unique user/review; updates review vote counts |
| `collections.ReadingCollection` | User shelf/list | `owner`, `name`, slug, `list_type`, `privacy`, default flag, item counters | Many books through `CollectionBook`; owner is `User` |
| `collections.CollectionBook` | Book in a reading collection | `collection`, `book`, `added_by`, status, position, notes, start/finish dates | Unique collection/book; updates collection and book counters |
| `collections.ReadingProgress` | User progress for a book | `user`, `book`, status, page, percent, timestamps | Unique user/book; updates book read count |
| `social.FollowRelationship` | Directed follow graph | `follower`, `following` | Unique follower/following; prevents self-follow |
| `social.FeedEvent` | Activity feed event | `actor`, `event_type`, optional `book`, generic target/action object, visibility, payload | Uses Django contenttypes for target/action references |
| `notifications.Notification` | In-app notification | `recipient`, generic actor/target/action object, `notification_type`, action, payload, read/delete timestamps | Recipient is `User`; generic references via contenttypes |
| `recommendations.RecommendationModel` | Trained recommendation artifact metadata | name/version/type, active flag, RMSE/MAE, thresholds, artifact URI, metrics | Active save deactivates other models |
| `recommendations.RecommendationRun` | Recommendation job state | optional model/task/user, run type, status, parameters, timestamps, error | One-to-one optional `TaskLog`; can notify requester |
| `recommendations.UserRecommendation` | Per-user ranked recommendation | `user`, `book`, model, source, rank, score, reason, active/dismiss/click timestamps | Unique user/book/model and user/model/rank |
| `recommendations.CatalogRecommendation` | Global ranked catalog recommendation | `book`, source, rank, score, generated time, active flag, reason | Unique source/generated/rank batch |
| `recommendations.RecommendationFeedback` | User feedback on recommendation/book | `user`, `book`, optional recommendation, feedback type, payload | Unique user/book/feedback type |
| `search.SearchQueryLog` | Search telemetry | query, normalized query, filters, sort/page/page size, result count, source/status, errors, hashes, external flag, cache flag | Optional `User` |
| `search.SearchAutocompleteTerm` | Autocomplete term index | term, generated normalized term, type, weight/use count, generic target, active flag | Optional generic target to book/author/genre |
| `search.SearchIndexStatus` | Search index operational state | name, status, current task, last rebuild, last indexed book, document count, error | Optional `TaskLog` and `Book` |
| `integrations.ExternalCatalogSource` | External provider registry | provider, display name, base URL, active flag, priority, last sync | One sync state; many external records/IDs/runs |
| `integrations.BookExternalIdentifier` | External ID for local book | book, source, identifier type, external ID/url | Unique source/type/external ID and book/source/type |
| `integrations.ExternalBookRecord` | Fetched provider record | source, external ID, ISBNs, title/subtitle, author names, raw/normalized payloads, matched book, merge status/confidence | Optional matched `Book` |
| `integrations.ExternalEnrichmentRequest` | User/system request to enrich catalog data | requested user, optional book/source/task, query/ISBNs, status, priority, timestamps, error | Optional `TaskLog`; user-scoped API for non-staff |
| `integrations.ExternalSyncRun` | External sync job state | source, task, sync type/status, query, counters, timestamps, error | Optional `TaskLog` |
| `integrations.ExternalSyncState` | External provider cursor/state | source, kind, cursor, success/error timestamps, totals | One-to-one `ExternalCatalogSource` |
| `operations.TaskLog` | Operational task tracking | task ID, task type, status, start/finish timestamps, error | Referenced by recommendation/search/integration task state models |

## API Surface

All application endpoints are mounted under `/api/v1/`. Unless a view overrides pagination, list responses use DRF pagination with `count`, `next`, `previous`, and `results`; cursor endpoints use `next`, `previous`, and `results`. Auth labels below map to current permission classes:

| Label | Current implementation |
|---|---|
| Public | `AllowAny` or safe-method access |
| Public read | `IsAuthenticatedOrReadOnly` or equivalent default safe-method access |
| Auth | `IsAuthenticated` |
| Admin | `IsAdminUser` |
| Staff write | Custom `IsAdminOrReadOnly`: safe methods public, writes require `user.is_staff` |
| Owner/staff write | Profile object permission: privacy-aware reads, writes by profile owner/staff/superuser |

### API documentation and auth

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET | `/api/v1/schema/` | Public in development; production public only when `API_SCHEMA_PUBLIC=True`, otherwise admin | None | OpenAPI 3.1 schema |
| GET | `/api/v1/docs/` | Same as schema | None | Swagger UI HTML |
| GET | `/api/v1/redoc/` | Same as schema | None | ReDoc HTML |
| POST | `/api/v1/auth/login/` | Public | dj-rest-auth login payload; email/password in this email-login project | JWT response from dj-rest-auth |
| POST | `/api/v1/auth/logout/` | Public route; token/session-dependent behavior | Optional logout payload from dj-rest-auth | `{detail}` |
| GET, PUT, PATCH | `/api/v1/auth/user/` | Auth | User detail update fields from dj-rest-auth configured to `UserSerializer` | `UserSerializer` |
| POST | `/api/v1/auth/password/reset/` | Public | `{email}` | `{detail}` |
| POST | `/api/v1/auth/password/reset/confirm/` | Public | `{uid, token, new_password1, new_password2}` | `{detail}` |
| POST | `/api/v1/auth/password/change/` | Auth | `{new_password1, new_password2}` | `{detail}` |
| POST | `/api/v1/auth/token/verify/` | Public | `{token}` | Empty 200 response or validation error |
| POST | `/api/v1/auth/token/refresh/` | Public | `{refresh}` or refresh cookie depending JWT cookie config | New JWT access/refresh data or cookies |
| POST | `/api/v1/auth/registration/` | Public | `{email, password1, password2, name?}` via `EmailRegisterSerializer` | JWT response |
| POST | `/api/v1/auth/registration/verify-email/` | Public | dj-rest-auth verify-email payload | `{detail}` |
| POST | `/api/v1/auth/registration/resend-email/` | Public | `{email}` | `{detail}` |
| GET and template methods | `/api/v1/auth/registration/account-confirm-email/<key>/` | Public | URL key | allauth confirmation template |
| GET and template methods | `/api/v1/auth/registration/account-email-verification-sent/` | Public | None | allauth template |

### Users and profiles

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET | `/api/v1/users/` | Admin | Pagination query params | Paginated `UserSerializer` |
| GET, PUT, PATCH | `/api/v1/users/me/` | Auth | Writable user fields: `first_name`, `last_name`, `display_name` | `UserSerializer` |
| GET, PUT, PATCH | `/api/v1/users/<pk>/` | Admin | Writable user fields | `UserSerializer` |
| GET | `/api/v1/users/<user_id>/profile/` | Public read, privacy checked | None | `ProfileSerializer` |
| GET | `/api/v1/users/<user_id>/profile-overview/` | Public read, privacy checked | None | `ProfileOverviewSerializer`: user, profile, viewer context, stats, recent reviews/ratings/collections |
| GET | `/api/v1/users/<user_id>/reviews/` | Public read, privacy checked | Pagination query params | Paginated `ReviewSerializer` |
| GET | `/api/v1/users/<user_id>/ratings/` | Public read, ratings privacy checked | Pagination query params | Paginated `RatingSerializer` |
| GET | `/api/v1/users/<user_id>/reading-collections/` | Public read, profile/collection privacy checked | Pagination query params | Paginated `ReadingCollectionSerializer` |
| GET, POST | `/api/v1/profiles/` | Public read; create requires Auth | Profile write fields: `handle`, `bio?`, `profile_type?`, `picture_fallback_url?`, `location?`, `website_url?`, `is_complete?`, `profile_completed_at?`, `completion_percent?` | Paginated/list or created `ProfileSerializer` |
| GET, PUT, PATCH | `/api/v1/profiles/me/` | Auth | Profile write fields | `ProfileSerializer` |
| POST | `/api/v1/profiles/me/picture/` | Auth | Multipart form with `picture`; allowed MIME types gif/jpeg/jpg/png/webp, max 5 MB | `{picture, cloudinary}` or field error |
| GET | `/api/v1/profiles/by-handle/<handle>/overview/` | Public read, privacy checked | None | `ProfileOverviewSerializer` |
| GET, POST | `/api/v1/profiles/me/interests/` | Auth | `{genre, weight?}` | Paginated/list or created `ProfileInterestSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/profiles/me/interests/<pk>/` | Auth; current user's profile interests only | `{genre?, weight?}` | `ProfileInterestSerializer` or 204 |
| GET, POST | `/api/v1/profiles/me/social-links/` | Auth | `{platform, url, label?}` | Paginated/list or created `UserSocialLinkSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/profiles/me/social-links/<pk>/` | Auth; current user's social links only | `{platform?, url?, label?}` | `UserSocialLinkSerializer` or 204 |
| GET, PUT, PATCH, DELETE | `/api/v1/profiles/<pk>/` | Owner/staff write; privacy-aware read | Profile write fields | `ProfileSerializer` or 204 |
| GET, PUT, PATCH | `/api/v1/preferences/me/` | Auth | Preference fields except `id`, `user`, timestamps | `UserPreferenceSerializer` |
| GET | `/api/v1/user-preferences/` | Admin | Pagination query params | Paginated `UserPreferenceSerializer` |
| GET, PUT, PATCH | `/api/v1/user-preferences/<pk>/` | Admin | Preference fields | `UserPreferenceSerializer` |

### Books, authors, and genres

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET, POST | `/api/v1/books/` | Staff write | Query params: `q`, `include_adult`, `genres`, `genre_ids`, `authors`, `author_ids`, `languages`, `sources`, `min_rating`, `max_rating`, `publication_year_from`, `publication_year_to`, `page_count_min`, `page_count_max`, `is_featured`, `ordering`; POST writable book fields including `title`, ISBNs, `author_ids`, `genre_ids`, catalog metadata, flags and scores | Paginated/list or created `BookSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/books/<pk>/` | Staff write | Writable book fields; DELETE archives instead of hard-deleting | `BookSerializer` or 204 |
| GET, POST | `/api/v1/authors/` | Staff write | Query params: `q`, `source`, `include_inactive` staff-only, `ordering`; POST `AuthorSerializer` writable fields | Paginated/list or created `AuthorSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/authors/<pk>/` | Staff write | Author writable fields | `AuthorSerializer` or 204 |
| GET, POST | `/api/v1/genres/` | Staff write | Query params: `q`, `parent`, `is_featured`, `ordering`; POST `GenreSerializer` writable fields | Paginated/list or created `GenreSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/genres/<pk>/` | Staff write | Genre writable fields | `GenreSerializer` or 204 |
| GET | `/api/v1/authors/<author_id>/books/` | Public read | Pagination query params | Paginated `BookSerializer` |
| GET | `/api/v1/genres/<genre_id>/books/` | Public read | Pagination query params | Paginated `BookSerializer` |
| GET, POST | `/api/v1/author-likes/` | Auth | `{author}` | Paginated/list or created `AuthorLikeSerializer`; user is inferred |
| GET, DELETE | `/api/v1/author-likes/<pk>/` | Auth; current user's likes only | None | `AuthorLikeSerializer` or 204 |
| GET, POST | `/api/v1/book-authors/` | Admin | `{book, author, role?, position?, contribution_note?}` | Paginated/list or created `BookAuthorSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/book-authors/<pk>/` | Admin | Book-author writable fields | `BookAuthorSerializer` or 204 |
| GET, POST | `/api/v1/book-genres/` | Admin | `{book, genre, is_primary?, position?}` | Paginated/list or created `BookGenreSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/book-genres/<pk>/` | Admin | Book-genre writable fields | `BookGenreSerializer` or 204 |
| GET, POST | `/api/v1/related-books/` | Admin | `{from_book, to_book_id, relation_type?, score?, source?}` | Paginated/list or created `RelatedBookSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/related-books/<pk>/` | Admin | Related-book writable fields | `RelatedBookSerializer` or 204 |
| GET | `/api/v1/books/<book_id>/related-books/` | Public read | Pagination query params | Paginated `RelatedBookSerializer` with nested `to_book` |
| GET, POST | `/api/v1/book-trend-snapshots/` | Admin | `{book, period, metric_date, view_count?, rating_count?, review_count?, collection_add_count?, search_click_count?, score?}` | Paginated/list or created `BookTrendSnapshotSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/book-trend-snapshots/<pk>/` | Admin | Trend snapshot writable fields | `BookTrendSnapshotSerializer` or 204 |

### Reviews and ratings

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET, POST | `/api/v1/ratings/` | Public read; create requires Auth | Query `mine=true` for current user's ratings. POST `{book?, value, rated_at?}`; `book` is required here | Paginated/list or upserted `RatingSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/ratings/<pk>/` | Auth; current user's ratings only | `{book?, value?, rated_at?}`; DELETE archives | `RatingSerializer` or 204 |
| GET, POST | `/api/v1/books/<book_id>/ratings/` | Public read; create requires Auth | POST `{value, rated_at?}`; book is taken from path | Paginated/list or upserted `RatingSerializer` |
| GET, POST | `/api/v1/reviews/` | Public read; create requires Auth | Query `mine=true` for current user's reviews. POST `{book?, rating?, title?, body, contains_spoilers?, reviewed_at?}`; `book` is required here | Paginated/list or created `ReviewSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/reviews/<pk>/` | Auth; current user's reviews only | Review writable fields; DELETE archives | `ReviewSerializer` or 204 |
| GET, POST | `/api/v1/books/<book_id>/reviews/` | Public read; create requires Auth | POST `{rating?, title?, body, contains_spoilers?, reviewed_at?}`; book is taken from path | Paginated/list or created `ReviewSerializer` |
| GET, POST | `/api/v1/review-votes/` | Auth | `{review, vote_type}` | Paginated/list or upserted `ReviewVoteSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/review-votes/<pk>/` | Auth; current user's votes only | `{review?, vote_type?}` | `ReviewVoteSerializer` or 204 |
| POST, DELETE | `/api/v1/reviews/<review_id>/votes/` | Auth | POST `{vote_type}`; DELETE has no body | POST returns `ReviewVoteSerializer`; DELETE returns 204 |

### Reading collections

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET, POST | `/api/v1/reading-collections/` | Public read; create requires Auth | Query `mine=true` for owned collections. POST `{name, slug, description?, list_type?, privacy?}` | Paginated/list or created `ReadingCollectionSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/reading-collections/<pk>/` | Auth; owned collections only | Reading collection writable fields; DELETE archives | `ReadingCollectionSerializer` or 204 |
| GET, POST | `/api/v1/collection-books/` | Auth | `{collection, book, status?, position?, notes?, added_at?, started_at?, finished_at?}`; collection must belong to current user | Paginated/list or created/restored `CollectionBookSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/collection-books/<pk>/` | Auth; owned collection items only | Collection-book writable fields; DELETE archives and syncs counters | `CollectionBookSerializer` or 204 |
| GET, POST | `/api/v1/reading-progress/` | Auth | `{book, status?, current_page?, percent_complete?, started_at?, finished_at?, last_read_at?, marked_read_at?}` | Paginated/list or upserted `ReadingProgressSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/reading-progress/<pk>/` | Auth; current user's progress only | Reading-progress writable fields; DELETE archives | `ReadingProgressSerializer` or 204 |

### Social and feed

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET, POST | `/api/v1/follows/` | Auth | Query `following=<user_id>` optional. POST `{following}` | Paginated/list or created `FollowRelationshipSerializer` |
| GET, DELETE | `/api/v1/follows/<pk>/` | Auth; current user's following rows only | None | `FollowRelationshipSerializer` or 204 |
| GET | `/api/v1/followers/` | Auth | Pagination query params | Paginated `FollowRelationshipSerializer` for current user's followers |
| GET | `/api/v1/users/<user_id>/followers/` | Public read, profile privacy checked | Pagination query params | Paginated `FollowRelationshipSerializer` |
| GET | `/api/v1/users/<user_id>/following/` | Public read, profile privacy checked | Pagination query params | Paginated `FollowRelationshipSerializer` |
| GET | `/api/v1/feed-events/` | Auth | Cursor pagination params | Cursor-paginated `FeedEventSerializer` |
| GET | `/api/v1/feed-events/<pk>/` | Auth | None | `FeedEventSerializer` |

### Notifications

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET | `/api/v1/notifications/` | Auth | Query `is_read=true|false`, `type=<notification_type>` | Paginated `NotificationSerializer` for current user |
| GET, DELETE | `/api/v1/notifications/<notification_id>/` | Auth; current user's notifications only | None | `NotificationSerializer` or 204 soft-delete |
| POST | `/api/v1/notifications/<notification_id>/read/` | Auth | None | Updated `NotificationSerializer` |
| POST | `/api/v1/notifications/<notification_id>/unread/` | Auth | None | Updated `NotificationSerializer` |
| POST | `/api/v1/notifications/mark-all-read/` | Auth | None | `{updated}` |
| GET | `/api/v1/notification-counts/unread/` | Auth | None | `{unread_count}` |

### Recommendations

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET | `/api/v1/recommendations/` | Auth | Cursor pagination params | Cursor-paginated `UserRecommendationSerializer` for current user |
| POST | `/api/v1/recommendations/generate/` | Auth | `{n_recommendations? 1..100, model_id?, train_if_missing?, force_train?, async_generation?}`; accepts legacy `async` alias | 200 list of `UserRecommendationSerializer`, or 202 `RecommendationRunSerializer` when async |
| GET | `/api/v1/recommendations/<pk>/` | Auth; current user's recommendations only | None | `UserRecommendationSerializer` |
| POST | `/api/v1/recommendations/<pk>/dismiss/` | Auth; current user's recommendations only | None | 204; also creates dismissed feedback |
| POST | `/api/v1/recommendations/<pk>/click/` | Auth; current user's recommendations only | None | Updated `UserRecommendationSerializer`; also creates clicked feedback |
| GET, POST | `/api/v1/catalog-recommendations/` | Staff write | Query `source`; POST `CatalogRecommendationSerializer` writable fields: `book`, `source`, `rank`, `score?`, `generated_at?`, `is_active?`, `reason?` | Cursor-paginated/list or created `CatalogRecommendationSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/catalog-recommendations/<pk>/` | Staff write | Catalog recommendation writable fields | `CatalogRecommendationSerializer` or 204 |
| GET, POST | `/api/v1/recommendation-feedback/` | Auth | `{book, recommendation?, feedback_type, payload?}`; user inferred | Paginated/list or created `RecommendationFeedbackSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/recommendation-feedback/<pk>/` | Auth; current user's feedback only | Feedback writable fields except user | `RecommendationFeedbackSerializer` or 204 |
| GET, POST | `/api/v1/recommendation-models/` | Admin | `RecommendationModelSerializer` writable fields | Paginated/list or created `RecommendationModelSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/recommendation-models/<pk>/` | Admin | Recommendation model writable fields | `RecommendationModelSerializer` or 204 |
| GET, POST | `/api/v1/recommendation-runs/` | Admin | `RecommendationRunSerializer` writable fields; create must use pending status and enqueues a run | Paginated/list or created `RecommendationRunSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/recommendation-runs/<pk>/` | Admin | Recommendation run writable fields | `RecommendationRunSerializer` or 204 |

### Search

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET | `/api/v1/search/books/` | Public read | Query params: `q`, `genres`, `genre_ids`, `authors`, `author_ids`, `languages`, `sources`, `min_rating`, `max_rating`, `pub_date_from`, `pub_date_to`, `publication_year_from`, `publication_year_to`, `page_count_min`, `page_count_max`, `num_pages`, `include_adult`, `include_external`, `ordering`, `page`, `page_size` | Paginated book results with extra keys `query`, `filters_applied`, `ordering`, `include_external` |
| GET | `/api/v1/search/suggestions/` | Public read | Query `{q, limit? 1..50, type?}` | `{query, suggestions, count}` where suggestions are `SearchAutocompleteTermSerializer` |
| GET | `/api/v1/search/autocomplete/` | Public read | Query `{q, limit? 1..50, type?}` | Paginated/list `SearchAutocompleteTermSerializer` |
| GET | `/api/v1/search/related-books/` | Public read | Query `{book_id? or title?, limit? 1..50, include_external?}` | `{reference_book, suggestions, count, include_external, external_enrichment_queued}` |
| GET, POST | `/api/v1/search/autocomplete-terms/` | Admin | `SearchAutocompleteTermSerializer` writable fields | Paginated/list or created `SearchAutocompleteTermSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/search/autocomplete-terms/<pk>/` | Admin | Autocomplete term writable fields | `SearchAutocompleteTermSerializer` or 204 |
| GET | `/api/v1/search/index-statuses/` | Admin | Pagination query params | Paginated `SearchIndexStatusSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/search/index-statuses/<pk>/` | Admin | Search index status writable fields | `SearchIndexStatusSerializer` or 204 |
| GET | `/api/v1/search/query-logs/` | Admin | Pagination query params | Paginated `SearchQueryLogSerializer` |
| GET, DELETE | `/api/v1/search/query-logs/<pk>/` | Admin | None | `SearchQueryLogSerializer` or 204 |

### Integrations and operations

| Method | Path | Auth | Request shape | Response shape |
|---|---|---|---|---|
| GET, POST | `/api/v1/external-sources/` | Admin | `ExternalCatalogSourceSerializer` writable fields | Paginated/list or created `ExternalCatalogSourceSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-sources/<pk>/` | Admin | External source writable fields | `ExternalCatalogSourceSerializer` or 204 |
| GET, POST | `/api/v1/external-identifiers/` | Admin | `{book, source, identifier_type?, external_id, external_url?}` | Paginated/list or created `BookExternalIdentifierSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-identifiers/<pk>/` | Admin | External identifier writable fields | `BookExternalIdentifierSerializer` or 204 |
| GET, POST | `/api/v1/external-records/` | Admin | External record writable fields including source, external ID, ISBN/title payloads, merge status/confidence, matched book | Paginated/list or created `ExternalBookRecordSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-records/<pk>/` | Admin | External record writable fields | `ExternalBookRecordSerializer` or 204 |
| GET, POST | `/api/v1/external-enrichment-requests/` | Auth; staff sees all, users see own | `{query?, isbn_13?, isbn_10?, status?, priority?, requested_at?, book?, source?}`; create enqueues Celery task | Paginated/list or created `ExternalEnrichmentRequestSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-enrichment-requests/<pk>/` | Auth; staff sees all, users see own | Writable enrichment fields; task/timestamps/error are read-only | `ExternalEnrichmentRequestSerializer` or 204 |
| GET, POST | `/api/v1/external-sync-runs/` | Admin | `ExternalSyncRunSerializer` writable fields | Paginated/list or created `ExternalSyncRunSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-sync-runs/<pk>/` | Admin | External sync run writable fields | `ExternalSyncRunSerializer` or 204 |
| GET, POST | `/api/v1/external-sync-states/` | Admin | `ExternalSyncStateSerializer` writable fields | Paginated/list or created `ExternalSyncStateSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/external-sync-states/<pk>/` | Admin | External sync state writable fields | `ExternalSyncStateSerializer` or 204 |
| GET, POST | `/api/v1/task-logs/` | Admin | `{task_id, task_type, status?, started_at?, finished_at?, error_message?}` | Paginated/list or created `TaskLogSerializer` |
| GET, PUT, PATCH, DELETE | `/api/v1/task-logs/<pk>/` | Admin | Task log writable fields | `TaskLogSerializer` or 204 |

## Environment Variables

`.env.example` is the canonical template. Requiredness below is based on current settings behavior plus operational requirements for production.

| Variable | Required | Example from template | Consumed by | Description |
|---|---|---|---|---|
| `DJANGO_SETTINGS_MODULE` | Required for explicit runtime mode | `config.settings.development` | `manage.py`, WSGI/ASGI/Celery defaults, Compose overrides | Selects the Django settings module. `manage.py` defaults to development; WSGI/ASGI/Celery default to production. |
| `DEBUG` | Optional in dev; should be false in production | `True` | `config/settings/base.py`, `development.py` | Enables Django debug behavior. |
| `SECRET_KEY` | Required in production | `replace-with-a-long-random-secret-key-at-least-50-characters` | `production.py`, Django signing | Django secret key. Production raises `ImproperlyConfigured` if missing. |
| `JWT_SIGNING_KEY` | Required in production | `your-jwt-signing-key-here-generate-a-new-one-at-least-64-bytes-for-hs512` | `base.py`, `production.py` | SimpleJWT HS512 signing key. Production raises if missing. |
| `JWT_ACCESS_TOKEN_MINUTES` | Optional | `15` | `base.py` | Access token lifetime. |
| `JWT_REFRESH_TOKEN_DAYS` | Optional | `7` | `base.py` | Refresh token lifetime. |
| `JWT_ROTATE_REFRESH_TOKENS` | Optional | `True` | `base.py` | Enables refresh token rotation. |
| `JWT_BLACKLIST_AFTER_ROTATION` | Optional | `True` | `base.py` | Blacklists old refresh tokens after rotation. |
| `JWT_UPDATE_LAST_LOGIN` | Optional | `False` | `base.py` | Controls SimpleJWT last-login updates. |
| `JWT_AUTH_HTTPONLY` | Optional; production defaults true if unset | `False` | `base.py`, `production.py`, dj-rest-auth | Controls whether JWT auth cookies are HTTP-only. Development template disables this so the current frontend can read bearer tokens from response bodies. |
| `DB_NAME` | Required for MariaDB deployments | `booknest_db` | `base.py`, Compose `db`, `web`, `celery` | Database name. |
| `DB_USER` | Required for MariaDB deployments | `booknest` | `base.py`, Compose | Database user. |
| `DB_PASSWORD` | Required for MariaDB deployments | `your_secure_password_here` | `base.py`, Compose | Database password. |
| `DB_HOST` | Required outside Compose defaults | `127.0.0.1` | `base.py`; Compose overrides to `db` for web/celery | Database host. |
| `DB_PORT` | Optional | `3306` | `base.py`; Compose sets container port `3306` | Database port used by Django. |
| `DB_CONN_MAX_AGE` | Optional | `60` | `base.py` | Persistent connection lifetime in seconds. |
| `DB_CONN_HEALTH_CHECKS` | Optional | `True` | `base.py` | Enables Django connection health checks. |
| `USE_MYSQL_TEST_DB` | Optional | `False` | `testing.py` | If false, tests use in-memory SQLite. If true, tests use the configured MySQL/MariaDB database. |
| `DB_HOST_PORT` | Optional | `3306` | Compose `db` port mapping | Host port mapped to MariaDB container port 3306. |
| `MARIADB_ROOT_PASSWORD` | Required for Compose db bootstrap | `your_secure_root_password_here` | Compose `db` service | Root password for MariaDB container. |
| `CLOUDINARY_CLOUD_NAME` | Required for Cloudinary media uploads | `your_cloudinary_cloud_name` | `base.py`, Cloudinary SDK | Cloudinary account cloud name. |
| `CLOUDINARY_API_KEY` | Required for Cloudinary media uploads | `your_cloudinary_api_key` | `base.py`, Cloudinary SDK | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Required for Cloudinary media uploads | `your_cloudinary_api_secret` | `base.py`, Cloudinary SDK | Cloudinary API secret. |
| `USE_REDIS_CACHE` | Optional in development | `False` | `development.py` | If false in development, Django uses local-memory cache instead of Redis. Base/production use Redis cache settings. |
| `REDIS_URL` | Required when Redis cache is used | `redis://127.0.0.1:6379/1` | `base.py`, Compose override | Django Redis cache URL. |
| `CELERY_BROKER_URL` | Required for async tasks | `redis://127.0.0.1:6379/0` | `base.py`, Celery, Compose override | Celery broker URL. |
| `CELERY_RESULT_BACKEND` | Optional; defaults to broker URL in code | `redis://127.0.0.1:6379/0` | `base.py`, Compose override | Celery result backend URL. |
| `REDIS_HOST_PORT` | Optional | `6379` | Compose `redis` port mapping | Host port mapped to Redis container port 6379. |
| `WEB_PORT` | Optional | `8000` | Compose `web` port mapping | Host port mapped to Django container port 8000. |
| `CELERY_LOG_LEVEL` | Optional | `info` | Compose `celery` command | Celery worker log level. |
| `CELERY_ACCEPT_CONTENT` | Not consumed by current settings | `json` | Present in `.env` only | Current `base.py` hard-codes `CELERY_ACCEPT_CONTENT = ["json"]`. |
| `CELERY_TASK_SERIALIZER` | Not consumed by current settings | `json` | Present in `.env` only | Current `base.py` hard-codes task serializer to JSON. |
| `CELERY_RESULT_SERIALIZER` | Not consumed by current settings | `json` | Present in `.env` only | Current `base.py` hard-codes result serializer to JSON. |
| `CELERY_TIMEZONE` | Optional | `UTC` | `base.py` | Celery timezone. |
| `CELERY_TASK_SOFT_TIME_LIMIT` | Optional | `600` | `base.py` | Celery soft time limit in seconds. |
| `CELERY_TASK_TIME_LIMIT` | Optional | `900` | `base.py` | Celery hard time limit in seconds. |
| `CELERY_RESULT_EXPIRES` | Optional | `86400` | `base.py` | Celery result expiration in seconds. |
| `ALLOWED_HOSTS` | Required in production | `localhost,127.0.0.1,0.0.0.0` | `base.py`, `development.py`, `production.py`, Docker build collectstatic | Host header allow-list. Production raises if empty. |
| `CSRF_TRUSTED_ORIGINS` | Required for browser clients using CSRF/cookies | `http://localhost:8000,http://127.0.0.1:8000` | `development.py`, `production.py` | Trusted origins for CSRF validation. |
| `CORS_ALLOWED_ORIGINS` | Required for browser clients | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173` | `development.py`, `production.py` | Explicit browser CORS origin allow-list. |
| `CORS_ALLOW_CREDENTIALS` | Optional | `True` | `base.py` | Allows cookies/credentials in CORS responses. |
| `SECURE_SSL_REDIRECT` | Production optional; defaults true in production | `True` | `production.py` | Redirects HTTP to HTTPS in production settings. |
| `SECURE_HSTS_SECONDS` | Optional | `31536000` | `production.py` | HSTS max-age seconds. |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | Optional | `True` | `production.py` | Adds HSTS includeSubDomains. |
| `SECURE_HSTS_PRELOAD` | Optional | `True` | `production.py` | Adds HSTS preload directive. |
| `API_SCHEMA_PUBLIC` | Optional | `True` | `base.py`, `development.py`, `production.py` | Controls public schema/docs access. Production defaults false when unset. |
| `DRF_PAGE_SIZE` | Optional | `20` | `base.py`, pagination classes | Default page size. |
| `DRF_MAX_PAGE_SIZE` | Optional | `100` | `base.py`, pagination classes | Max client-selected page size. |
| `DRF_ANON_RATE` | Optional | `100/hour` | `base.py` | DRF anonymous throttle rate. |
| `DRF_USER_RATE` | Optional | `1000/hour` | `base.py` | DRF authenticated throttle rate. |
| `EMAIL_BACKEND` | Optional | `django.core.mail.backends.console.EmailBackend` | `base.py`, `development.py` | Email backend. Development defaults to console. |
| `EMAIL_HOST` | Required for SMTP delivery | `smtp.gmail.com` | `base.py` | SMTP host. |
| `EMAIL_PORT` | Optional | `587` | `base.py` | SMTP port. |
| `EMAIL_USE_TLS` | Optional | `True` | `base.py` | Enables SMTP TLS. |
| `EMAIL_HOST_USER` | Required for authenticated SMTP | Empty | `base.py` | SMTP username. |
| `EMAIL_HOST_PASSWORD` | Required for authenticated SMTP | Empty | `base.py` | SMTP password. |
| `DEFAULT_FROM_EMAIL` | Optional; defaults to `EMAIL_HOST_USER` | Empty | `base.py`, users adapter | Sender address for account email. |
| `FRONTEND_URL` | Optional in settings; current reset adapter does not use it | `http://localhost:3000` | `base.py` | Intended frontend URL for account links. Current `CustomAccountAdapter` hard-codes `http://localhost:3000/password-reset-confirm/...`. |
| `SITE_NAME` | Optional | `BookNest` | `base.py` | Email subject prefix/site name. |
| `DJANGO_LOG_DIR` | Optional | `logs` | `base.py` | Log directory; created at settings import time. |
| `DJANGO_LOG_FILE` | Optional | `logs/django_debug.log` | `base.py` | Rotating Django log file path. |
| `RECOMMENDATION_LOG_FILE` | Optional | `logs/recommendations.log` | `base.py` | Rotating recommendation logger file path. |
| `DJANGO_LOG_MAX_BYTES` | Optional | `10485760` | `base.py` | Rotating log max bytes. |
| `DJANGO_LOG_BACKUP_COUNT` | Optional | `5` | `base.py` | Rotating log backup count. |
| `CACHE_TTL` | Optional | `900` | `base.py` | Default cache TTL used by settings; search service has its own external-enrichment cache TTL constant. |
| `CACHE_KEY_PREFIX` | Optional | `booknest` | `base.py`, search services | Prefix for cache keys, including external-enrichment enqueue suppression. |

Additional environment variables supported by code but not listed in `.env.example`: `DATA_UPLOAD_MAX_MEMORY_SIZE`, `FILE_UPLOAD_MAX_MEMORY_SIZE`, `EMAIL_TIMEOUT`, `SESSION_COOKIE_SAMESITE`, and `CSRF_COOKIE_SAMESITE`.

## Local Development Setup

Prerequisites:

- Python 3.14.4.
- `uv` available on PATH.
- Docker with Docker Compose for MariaDB and Redis, unless you provide those services yourself.

From a clean checkout:

```bash
cd server
cp .env.example .env
uv sync --frozen
docker compose up -d db redis
uv run python manage.py migrate
uv run python manage.py init_integrations
uv run python manage.py rebuild_search_index
uv run python manage.py runserver 127.0.0.1:8000
```

Local URLs:

- API root paths: `http://127.0.0.1:8000/api/v1/`
- Swagger UI: `http://127.0.0.1:8000/api/v1/docs/`
- ReDoc: `http://127.0.0.1:8000/api/v1/redoc/`
- Django admin: `http://127.0.0.1:8000/admin/`

Optional local admin user:

```bash
uv run python manage.py createsuperuser
```

There is no dedicated seed fixture in the source tree. `init_integrations` creates default OpenLibrary and Google Books source rows plus sync state. `rebuild_search_index` rebuilds denormalized book search labels and autocomplete terms from whatever catalog data exists.

## Docker and Containerized Setup

The Dockerfile builds a production-style image:

- Base image: `python:3.14-slim`.
- Installs `uv` 0.11.3 from `ghcr.io/astral-sh/uv`.
- Builder stage installs prod dependency group only with `uv sync --frozen --only-group prod --no-install-project`.
- Runs `collectstatic` during build with placeholder secrets and production settings.
- Runtime stage installs `libmariadb3`, creates a non-root `app` user, exposes port 8000, and starts Gunicorn with `config.wsgi:application`.

Build the image:

```bash
cd server
docker build -t booknest-backend .
```

Run the full local stack with Compose:

```bash
cd server
cp .env.example .env
docker compose up --build
```

Compose services:

| Service | Image/build | Command | Ports | Volumes | Purpose |
|---|---|---|---|---|---|
| `db` | `mariadb:11.8` | MariaDB default | `127.0.0.1:${DB_HOST_PORT:-3306}:3306` | `mariadb_data` | Application database |
| `redis` | `redis:7-alpine` | Redis default | `127.0.0.1:${REDIS_HOST_PORT:-6379}:6379` | `redis_data` | Cache, Celery broker, Celery backend |
| `migrate` | Local Dockerfile build | `python manage.py migrate --noinput` | None | source bind, `app_venv`, `./media`, `./logs` | One-shot migration gate before web/celery |
| `web` | Local Dockerfile build | `python manage.py runserver 0.0.0.0:8000` | `127.0.0.1:${WEB_PORT:-8000}:8000` | source bind, `app_venv`, `./media`, `./logs` | Development API server |
| `celery` | Local Dockerfile build | `celery -A config worker --loglevel=${CELERY_LOG_LEVEL:-info}` | None | source bind, `app_venv`, `./media`, `./logs` | Async task worker |

Useful Compose commands:

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f celery
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py init_integrations
docker compose exec web python manage.py rebuild_search_index
docker compose down
```

Required secrets for production-style container runs are the production variables documented above, especially `SECRET_KEY`, `JWT_SIGNING_KEY`, `ALLOWED_HOSTS`, database credentials, Redis/Celery URLs, CORS/CSRF origins, and Cloudinary credentials.

## Available Commands

There is no `package.json`, `Makefile`, or `justfile` in `server/`; the backend uses `uv`, Django management commands, pytest, Ruff, mypy, and Docker Compose directly.

| Command | What it does | When to use it |
|---|---|---|
| `uv sync --frozen` | Installs locked prod, dev, and test dependency groups into `.venv` | Initial setup and dependency refresh |
| `uv run python manage.py check` | Runs Django system checks with development settings by default | Quick configuration sanity check |
| `uv run python manage.py check --deploy --settings=config.settings.production` | Runs Django deployment checks | Before production deployment |
| `uv run ruff check .` | Runs lint checks | Before committing backend Python changes |
| `uv run ruff format .` | Formats Python files with Ruff | Before committing formatting changes |
| `uv run mypy .` | Runs mypy using the Django plugin configured in `pyproject.toml` | Type-checking pass |
| `uv run pytest` | Runs the complete test suite through pytest-django | Normal test run |
| `uv run coverage run -m pytest` | Runs tests under coverage | Coverage measurement |
| `uv run coverage report -m` | Prints coverage report | After coverage run |
| `uv run celery -A config worker --loglevel=info` | Starts Celery worker | Local async task processing without Compose web service |

Project management commands:

| Command | Arguments | What it does |
|---|---|---|
| `uv run python manage.py init_integrations` | None | Creates default OpenLibrary and Google Books source rows and sync states |
| `uv run python manage.py rebuild_search_index` | None | Rebuilds book search labels and autocomplete terms |
| `uv run python manage.py repair_denormalized_data` | None | Repairs author, genre, book, review/rating, and collection counters/labels |
| `uv run python manage.py clean_catalog` | `--apply`, `--skip-repair`, `--skip-search-rebuild` | Dry-runs or applies catalog cleanup: archives malformed books and collapses imported tags into canonical genres |
| `uv run python manage.py train_recommendation_model` | `--model-type`, `--min-ratings`, `--version` | Trains and activates a recommendation model from current ratings |
| `uv run python manage.py generate_recommendations` | `--user-id` or `--all`, `--model-id`, `--count`, `--min-ratings`, `--no-train` | Generates personalized or fallback recommendations |
| `uv run python manage.py refresh_catalog_recommendations` | `--source`, `--limit` | Refreshes global catalog recommendations from popularity/trending signals |
| `uv run python manage.py export_recommendation_data` | `--output-dir` | Exports ratings and active user recommendations to CSV |

## Testing

Test configuration:

- Test settings module: `config.settings.testing` from `pyproject.toml`.
- Test runner: pytest 9.0.3 with pytest-django 4.12.0.
- Django/DRF test classes: `TestCase`, `SimpleTestCase`, and `APITestCase`.
- Test database: in-memory SQLite by default. Set `USE_MYSQL_TEST_DB=True` to use the configured MySQL/MariaDB database.
- Celery behavior: eager tasks with propagated exceptions in testing settings.
- Test locations: `apps/*/tests/`.

Run all tests:

```bash
cd server
uv run pytest
```

Run unit/service-oriented tests:

```bash
uv run pytest apps/recommendations/tests/test_services.py
```

Run API/view integration tests:

```bash
uv run pytest apps/books/tests/test_views.py apps/reviews/tests/test_views.py apps/search/tests/test_views.py apps/social/tests/test_views.py apps/users/tests/test_profile_activity_views.py
```

Run signal tests:

```bash
uv run pytest apps/social/tests/test_signals.py apps/notifications/tests/test_signals.py apps/recommendations/tests/test_signals.py
```

Coverage:

```bash
uv run coverage run -m pytest
uv run coverage report -m
uv run coverage html
```

No E2E or contract test suite is present in the backend source tree.

## Database Migrations

Create migrations after model changes:

```bash
cd server
uv run python manage.py makemigrations
```

Create migrations for one app:

```bash
uv run python manage.py makemigrations books
```

Check for missing migrations without writing files:

```bash
uv run python manage.py makemigrations --check --dry-run
```

Run pending migrations:

```bash
uv run python manage.py migrate
```

Check migration state:

```bash
uv run python manage.py showmigrations
uv run python manage.py migrate --check
```

Rollback an app to a previous migration:

```bash
uv run python manage.py migrate books 0001
```

Rollback an app completely:

```bash
uv run python manage.py migrate books zero
```

In Compose, run migration commands inside the `web` service after the stack is up:

```bash
docker compose exec web python manage.py migrate
```

## Authentication and Authorization

Authentication is JWT-based. `REST_AUTH["USE_JWT"] = True` configures dj-rest-auth to issue JWTs on login and registration; SimpleJWT validates tokens with HS512, `JWT_SIGNING_KEY`, configurable access/refresh lifetimes, refresh rotation, and token blacklist support. DRF's default authentication class is `dj_rest_auth.jwt_auth.JWTCookieAuthentication`, and `apps/users/schema.py` documents it in OpenAPI as bearer auth (`jwtHeaderAuth`) for `Authorization: Bearer <token>`.

Token issuance paths:

- `/api/v1/auth/login/` returns JWT data for valid credentials.
- `/api/v1/auth/registration/` creates a user through `EmailRegisterSerializer` and returns JWT data.
- `/api/v1/auth/token/refresh/` refreshes access credentials.
- `/api/v1/auth/token/verify/` validates a token.
- `/api/v1/auth/logout/` uses dj-rest-auth logout behavior.

Authorization is enforced at three layers:

- DRF permission classes on views: `IsAuthenticated`, `IsAuthenticatedOrReadOnly`, `IsAdminUser`, custom staff-read-only permissions, and profile owner/staff permissions.
- Queryset scoping in views/selectors: user-owned ratings, reviews, follows, collections, progress, feedback, notifications, and enrichment requests are filtered to the current user unless staff access is explicitly allowed.
- `ProfileRequiredMiddleware`: authenticated users without a `Profile` receive HTTP 403 on protected feature paths, with a response pointing them to `/api/v1/profiles/`. Auth, admin, schema, profile creation, profile detail, user list, and selected auth/session paths are exempt.

Privacy rules are centralized in `apps/users/selectors.py`. Private profiles block profile overview, social lists, profile detail, reviews, and collections for other viewers; hidden ratings block public rating lists and omit ratings from profile overviews.

## External Integrations

| Integration | Source files | Configuration | Behavior |
|---|---|---|---|
| Cloudinary media storage | `config/settings/base.py`, `apps/users/services.py`, `apps/books/models.py`, `apps/users/models.py` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Default media storage is `cloudinary_storage.storage.MediaCloudinaryStorage`. Profile uploads call `cloudinary.uploader.upload`, store under `profile_pictures/<handle>/`, crop to 400x400, use automatic quality/format, and save the secure URL. Book covers and author/profile pictures use `CloudinaryField`. |
| OpenLibrary catalog search | `apps/integrations/services.py` | Stored source row from `init_integrations`: provider `openlibrary`, base URL `https://openlibrary.org` | Calls `GET /search.json` with `q` and `limit`. Timeout is 8 seconds. Results are normalized into external records and merged into local books/authors/genres. |
| Google Books catalog search | `apps/integrations/services.py` | Stored source row from `init_integrations`: provider `google_books`, base URL `https://www.googleapis.com/books/v1` | Calls `GET /volumes` with `q` and `maxResults`. Timeout is 8 seconds. Results are normalized into external records and merged into local books/authors/genres. |
| Redis cache and Celery broker | `config/settings/base.py`, `config/settings/development.py`, `config/celery.py`, task modules | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `USE_REDIS_CACHE` | Production/base cache uses Redis. Development uses local-memory cache unless `USE_REDIS_CACHE=True`. Celery uses Redis for broker/results. |
| SMTP email | `config/settings/base.py`, `config/settings/development.py`, `apps/users/adapter.py` | `EMAIL_*`, `DEFAULT_FROM_EMAIL`, `SITE_NAME` | Password reset mail is sent through the custom allauth adapter. Development defaults to console email backend. |

Rate limits and retries:

- External HTTP calls use `requests.get(..., timeout=8)` and `raise_for_status()`.
- `search_and_merge_external_books` catches `requests.RequestException`, logs a warning, and continues with the next source.
- Celery `apply_async` calls set `retry=False`; no task retry policy is configured in source.
- Search enrichment enqueue is suppressed for the same normalized query for 6 hours with a cache key using `CACHE_KEY_PREFIX`.

## Deployment

No CI workflow, production Compose file, `fly.toml`, `railway.toml`, `render.yaml`, or `Procfile` is present in this repository. The discoverable deployment artifact is the Dockerfile.

Production build:

```bash
cd server
docker build -t booknest-backend .
```

Production run requirements:

- Provide `DJANGO_SETTINGS_MODULE=config.settings.production`.
- Provide `SECRET_KEY`, `JWT_SIGNING_KEY`, and non-empty `ALLOWED_HOSTS`; production settings raise immediately if any are missing.
- Provide MariaDB connection variables.
- Provide Redis/Celery URLs if cache/tasks should work.
- Provide `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` for browser clients.
- Provide Cloudinary credentials for media uploads.
- Provide SMTP variables for real email delivery.

Typical production release sequence:

```bash
uv run python manage.py check --deploy --settings=config.settings.production
uv run python manage.py migrate --settings=config.settings.production
uv run python manage.py collectstatic --noinput --settings=config.settings.production
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60 --access-logfile - --error-logfile -
```

When using the provided Dockerfile, `collectstatic` runs at image build time and Gunicorn is already the container `CMD`. Migrations still need to run as a release step before serving traffic.

There is no dedicated health-check endpoint in `config/urls.py` or app URLconfs. The only always-defined operational HTTP endpoints are schema/docs paths, and production schema access may be admin-only when `API_SCHEMA_PUBLIC=False`.

## Troubleshooting

| Failure mode | Likely cause | Exact fix |
|---|---|---|
| `django.db.utils.OperationalError` or connection refused to MariaDB | MariaDB is not running, `DB_HOST`/`DB_PORT` points to the wrong network, or host port mapping changed | For host development run `docker compose up -d db`, keep `DB_HOST=127.0.0.1`, and set `DB_PORT` to the host port exposed by `DB_HOST_PORT`. For Compose web/celery, let Compose override `DB_HOST=db` and `DB_PORT=3306`. |
| MariaDB access denied for `booknest` | `.env` values differ from the credentials used when the persistent `mariadb_data` volume was initialized | Either restore the original `DB_USER`/`DB_PASSWORD`/`DB_NAME`, or recreate the volume with `docker compose down -v` and then `docker compose up -d db`. |
| Production startup raises `SECRET_KEY must be set in production`, `JWT_SIGNING_KEY must be set in production`, or `ALLOWED_HOSTS must be set in production` | `config.settings.production` validates these variables at import time | Export non-empty production values before running `check`, `migrate`, `collectstatic`, Gunicorn, ASGI, WSGI, or Celery. |
| Authenticated API calls return 403 `Profile required` | `ProfileRequiredMiddleware` blocks protected paths for authenticated users without a profile | Create a profile with `POST /api/v1/profiles/` using at least `handle`, or create one through admin/management shell for the user. |
| Profile picture upload fails or returns Cloudinary errors | Missing/invalid Cloudinary credentials, unsupported MIME type, or file over 5 MB | Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; upload only gif/jpeg/jpg/png/webp; keep files at or below 5 MB. |
| Celery tasks do not run | Redis is down or `CELERY_BROKER_URL` points to the wrong host | Start Redis with `docker compose up -d redis`. For host workers use `redis://127.0.0.1:6379/0`; for Compose services use the injected `redis://redis:6379/0`. |
| External enrichment creates requests but no books appear | Celery worker is not processing `process_external_enrichment_request`, provider HTTP calls fail, or no default sources exist | Run `uv run python manage.py init_integrations`, start a Celery worker, then inspect `ExternalEnrichmentRequest.error_message`, `ExternalBookRecord`, and logs. |
| Search results or autocomplete look stale | Denormalized book labels or autocomplete terms are out of date | Run `uv run python manage.py rebuild_search_index`; if counters are wrong, run `uv run python manage.py repair_denormalized_data` first. |
| Recommendation generation returns fallback or no personalized model | Not enough rating data, missing active artifact, or media artifact cannot be read | Add ratings, run `uv run python manage.py train_recommendation_model`, verify the artifact under `media/recommendation_models/`, then run `uv run python manage.py generate_recommendations --user-id <id>`. |
| Port 8000, 3306, or 6379 is already in use | Local process conflicts with Compose mappings | Change `WEB_PORT`, `DB_HOST_PORT`, or `REDIS_HOST_PORT` in `.env`; if running Django on the host and changing `DB_HOST_PORT`, also set `DB_PORT` to the same host port. |
