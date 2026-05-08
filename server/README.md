# BookNest Backend

BookNest backend is a Django REST Framework API for book discovery, reviews, reading collections, social feed events, notifications, search, external catalog integrations, and recommendations. The service is organized as a modular Django project with domain apps under `apps/`, split settings under `config/settings/`, MariaDB as the primary database, Redis/Celery for background work, and `uv` for Python dependency and environment management.

## Table Of Contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Enhanced Data Model](#enhanced-data-model)
- [Repository Layout](#repository-layout)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Docker Development](#docker-development)
- [Database Maintenance](#database-maintenance)
- [Search Index](#search-index)
- [Recommendation Jobs](#recommendation-jobs)
- [API Documentation](#api-documentation)
- [Frontend Integration](#frontend-integration)
- [Testing And Verification](#testing-and-verification)
- [Logging](#logging)
- [Background Jobs](#background-jobs)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Stack

| Area | Technology |
| --- | --- |
| Runtime | Python 3.14.4 |
| Dependency manager | `uv` with `pyproject.toml` and `uv.lock` |
| Web framework | Django 6.0.5 |
| API | Django REST Framework 3.17.1 |
| Auth | `dj-rest-auth`, `django-allauth`, Simple JWT |
| Database | MariaDB via `django.db.backends.mysql` and `mysqlclient` |
| Cache | Redis through `django-redis`; local memory cache by default in development |
| Background jobs | Celery with Redis broker/result backend |
| Media | Cloudinary / `django-cloudinary-storage` |
| API schema | `drf-spectacular` |
| Production server dependency | Gunicorn |
| Static files | WhiteNoise |
| Quality gates | Django test runner, pytest, coverage, Ruff, mypy, django-stubs |

## Architecture

The backend follows a domain-app layout. Each app owns its schema, query access, write orchestration, serializers, views, URL routes, and background/management entry points for its own domain:

- `apps/common`: shared helper app for abstract timestamp and soft-delete base models.
- `apps/operations`: operational task logs and cross-domain repair commands.
- `apps/users`: email-first user model, profiles, preferences, profile interests, social links, auth/profile API.
- `apps/books`: catalog books, authors, genres, through tables, related books, author likes, and trend snapshots.
- `apps/reviews`: ratings, reviews, review votes, and review/rating counter maintenance.
- `apps/collections`: reading collections, collection items, reading progress, and collection/read counters.
- `apps/social`: follow relationships and feed events.
- `apps/notifications`: single enhanced notification model, unread/read/delete operations, and notification queries.
- `apps/recommendations`: recommendation model metadata, runs, user/catalog recommendations, feedback, and recommendation tasks.
- `apps/search`: search query logs, throttling buckets, autocomplete terms, search index status, and search rebuild commands.
- `apps/integrations`: external catalog sources, identifiers, external records, enrichment requests, sync runs/state, and integration tasks.

Each app follows the same internal layering:

- `models.py`: database schema, model-level behavior, and local querysets/managers.
- `selectors.py`: read/query access paths. Prefer these for list/detail query composition.
- `services.py`: writes/actions/orchestration. Prefer these for business operations.
- `views.py`: HTTP-specific request/response handling.
- `serializers.py`: DRF serialization and validation.
- `tests/`: app-local tests split into model, view, service, selector, and search coverage.

Views should stay thin: parse request input, call selectors/services, and return responses. Business logic belongs in services/selectors.

## Enhanced Data Model

The current schema is the enhanced model set. Legacy `follows`, singular `recommendation`, `CustomUser`, old book search index, and old review/notification models are not active apps or models.

Shared model behavior:

- `apps.common.models.TimeStampedModel`: `created_at` and `updated_at`.
- `apps.common.models.SoftDeleteModel`: timestamp fields plus `is_archived`, `archived_at`, `archive_reason`, and `archive()`.
- `apps.operations.models.TaskLog`: operational task tracking for external syncs, enrichment, recommendations, search rebuilds, CSV export, data repair, and random test data.

Domain model ownership:

| App | Models |
| --- | --- |
| `users` | `User`, `Profile`, `UserPreference`, `ProfileInterest`, `UserSocialLink` |
| `books` | `Author`, `AuthorLike`, `Genre`, `Book`, `BookAuthor`, `BookGenre`, `RelatedBook`, `BookTrendSnapshot` |
| `reviews` | `Rating`, `Review`, `ReviewVote` |
| `collections` | `ReadingCollection`, `CollectionBook`, `ReadingProgress` |
| `social` | `FollowRelationship`, `FeedEvent` |
| `notifications` | `Notification` |
| `recommendations` | `RecommendationModel`, `RecommendationRun`, `UserRecommendation`, `CatalogRecommendation`, `RecommendationFeedback` |
| `search` | `SearchQueryLog`, `SearchThrottleBucket`, `SearchAutocompleteTerm`, `SearchIndexStatus` |
| `integrations` | `ExternalCatalogSource`, `BookExternalIdentifier`, `ExternalBookRecord`, `ExternalEnrichmentRequest`, `ExternalSyncRun`, `ExternalSyncState` |

Denormalized fields are intentional. `Book.average_rating`, catalog counters, `Book.author_names`, `Book.genre_labels`, profile counters, and trend snapshots keep catalog/feed/profile reads cheap. Services and signals maintain these where possible; `repair_denormalized_data` is the repair path after imports or manual restores.

Search uses `books.MariaDBFullTextIndex` on `Book.title`, `subtitle`, `author_names`, `genre_labels`, `description`, `isbn_13`, and `isbn_10`. On MySQL/MariaDB it emits a full-text index; on non-MySQL backends it falls back to a normal Django index.

Fresh deployments should run migrations, initialize external source rows, initialize/rebuild search data, and create default reading collections for users through the user/profile signal path or a backfill if importing users.

## Repository Layout

```text
server/
|-- apps/
|   |-- common/
|   |   `-- models.py
|   |-- operations/
|   |   |-- management/commands/
|   |   |   `-- repair_denormalized_data.py
|   |   |-- serializers.py
|   |   |-- urls.py
|   |   |-- views.py
|   |   |-- models.py
|   |   `-- tests/
|   |-- books/
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- reviews/
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- services.py
|   |   |-- serializers.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- collections/
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- signals.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- social/
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- signals.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- notifications/
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- recommendations/
|   |   |-- management/commands/
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- selectors.py
|   |   |-- services.py
|   |   |-- urls.py
|   |   |-- views.py
|   |   `-- tasks.py
|   |-- search/
|   |   |-- management/commands/
|   |   |   `-- rebuild_search_index.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- selectors.py
|   |   |-- services.py
|   |   |-- urls.py
|   |   |-- views.py
|   |   `-- tasks.py
|   |-- integrations/
|   |   |-- management/commands/
|   |   |   `-- init_integrations.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- selectors.py
|   |   |-- services.py
|   |   |-- urls.py
|   |   |-- views.py
|   |   `-- tasks.py
|   `-- users/
|       |-- models.py
|       |-- serializers.py
|       |-- selectors.py
|       |-- services.py
|       |-- urls.py
|       `-- views.py
|-- config/
|   |-- settings/
|   |   |-- base.py
|   |   |-- development.py
|   |   |-- production.py
|   |   `-- testing.py
|   |-- asgi.py
|   |-- celery.py
|   |-- urls.py
|   `-- wsgi.py
|-- logs/                    # Runtime logs only, ignored by Git
|-- media/                   # Local media fallback, ignored by Git
|-- .dockerignore            # Docker build context exclusions
|-- .env.example             # Tracked template
|-- .python-version          # Python pin: 3.14.4
|-- Dockerfile
|-- docker-compose.yml
|-- manage.py
|-- pyproject.toml
`-- uv.lock
```

## Configuration

Settings modules:

- `config.settings.base`: shared application, database, cache, auth, logging, API, static/media, and Celery settings.
- `config.settings.development`: local development defaults, debug enabled, relaxed local security, console email backend by default, and local-memory cache unless `USE_REDIS_CACHE=True`.
- `config.settings.production`: production security settings, CORS/CSRF allowlists, and deploy checks.
- `config.settings.testing`: test password hashing, email backend, cache, and media root.

Default command behavior:

- `manage.py` defaults to `config.settings.development`.
- `config/wsgi.py`, `config/asgi.py`, and `config/celery.py` default to `config.settings.production`.

### Environment File

Create a local env file from the template:

```bash
cp .env.example .env
```

`server/.env` is ignored by Git. Do not commit secrets.

Key variables:

| Variable | Purpose |
| --- | --- |
| `DJANGO_SETTINGS_MODULE` | Usually `config.settings.development` locally or `config.settings.production` in deployment |
| `DEBUG` | Development debug flag |
| `SECRET_KEY` | Django signing secret; use a long random value |
| `JWT_SIGNING_KEY` | Simple JWT HS512 signing key; use at least 64 bytes |
| `DB_NAME` | MariaDB database name |
| `DB_USER` | MariaDB application user |
| `DB_PASSWORD` | MariaDB application password |
| `DB_HOST` | `127.0.0.1` locally, `db` in Docker Compose |
| `DB_PORT` | Usually `3306` |
| `DB_HOST_PORT` | Host port published by Docker Compose for MariaDB |
| `MARIADB_ROOT_PASSWORD` | Root password used when Docker initializes MariaDB |
| `USE_REDIS_CACHE` | Set `True` to use Redis for Django cache in development; defaults to in-memory cache |
| `REDIS_URL` | Django cache Redis URL when Redis cache is enabled |
| `CELERY_BROKER_URL` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | Celery result backend URL |
| `REDIS_HOST_PORT` | Host port published by Docker Compose for Redis |
| `WEB_PORT` | Host port published by Docker Compose for Django |
| `CELERY_LOG_LEVEL` | Celery worker log level in Docker Compose |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `ALLOWED_HOSTS` | Comma-separated Django host allowlist |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted origins |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `FRONTEND_URL` | URL used in account/auth email flows |
| `SITE_NAME` | Human-readable site name used in email subject prefixes |
| `DJANGO_LOG_DIR` | Log directory, defaults to `logs` under `server/` |
| `DJANGO_LOG_FILE` | Main Django log path |
| `RECOMMENDATION_LOG_FILE` | Recommendation log path |

For native local MariaDB:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
```

Development uses Django's local-memory cache by default so normal API requests do not require Redis. Set `USE_REDIS_CACHE=True` only when a Redis server is running locally.

Docker Compose overrides `DB_HOST`, `REDIS_URL`, `CELERY_BROKER_URL`, and `CELERY_RESULT_BACKEND` inside the `web` and `celery` containers, so `.env.example` can stay safe for host-based development.

## Local Development

Install dependencies and create the virtual environment:

```bash
uv sync
```

Run migrations:

```bash
uv run python manage.py migrate
```

Initialize rows and derived search data after a fresh database setup:

```bash
uv run python manage.py init_integrations
uv run python manage.py rebuild_search_index
```

Repair denormalized counters and labels after imports, direct SQL changes, or restores:

```bash
uv run python manage.py repair_denormalized_data
```

Rebuild denormalized book search labels and autocomplete terms after large book/author/genre imports:

```bash
uv run python manage.py rebuild_search_index
```

Start the development server:

```bash
uv run python manage.py runserver
```

Useful local checks:

```bash
uv run python -Wd manage.py check
uv run python manage.py test --verbosity=2
```

## Docker Development

Docker Compose starts MariaDB, Redis, Django, Celery, and a one-shot migration service:

```bash
cp .env.example .env
docker compose up --build
```

Services:

| Service | Host Port | Purpose |
| --- | --- | --- |
| `web` | `127.0.0.1:8000` | Django API |
| `db` | `127.0.0.1:3306` | MariaDB |
| `redis` | `127.0.0.1:6379` | Cache and broker |
| `migrate` | none | Runs `python manage.py migrate --noinput`, then exits |
| `celery` | none | Background worker |

Compose waits for MariaDB and Redis healthchecks before starting Django services. The default network is managed by Compose, so services use `db` and `redis` as hostnames.

Run backend commands in the web container:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py check
```

Create admin users explicitly with `createsuperuser`; Docker startup does not create a default admin account.

MariaDB data is persisted in the named Docker volume `mariadb_data`. Redis data is persisted in `redis_data`, and the container virtual environment is kept in `app_venv` so the source bind mount does not hide the image's installed dependencies.

- `docker compose down` stops containers and keeps data.
- `docker compose down -v` removes volumes and deletes database data.

## Database Maintenance

BookNest uses MariaDB from the start. The active migration graph is the enhanced schema only: `books` and `users` end at `0002_initial` and `0001_initial` respectively, and the legacy compatibility/copy migrations have been removed.

Run migrations:

```bash
uv run python manage.py migrate
```

Run denormalized data repairs after large imports or restores:

```bash
uv run python manage.py repair_denormalized_data
```

The repair command refreshes:

- author book counters
- book rating counters and average ratings
- book review counters
- book author and genre display labels
- genre book counters
- collection item counters

Runtime services/signals maintain review vote counts, book collection/read counters, and profile follow counters during normal writes.

Create a local MariaDB backup after repairs:

```bash
set -a
. ./.env
set +a
mkdir -p backups
MYSQL_PWD="$DB_PASSWORD" mariadb-dump --single-transaction --quick \
  --routines --triggers --events -u "$DB_USER" "$DB_NAME" \
  > backups/booknest_mariadb_clean.sql
```

Database dumps are ignored by Git and should be stored securely because they may contain user data and password hashes.

## Search Index

Book search uses denormalized book labels plus stored autocomplete terms. Rebuild them after large catalog imports, repaired relationships, or direct data restores:

```bash
uv run python manage.py rebuild_search_index
```

## Recommendation Jobs

Recommendation management commands live under `apps/recommendations/management/commands/`.

Refresh catalog recommendations from current popularity signals:

```bash
uv run python manage.py refresh_catalog_recommendations --source trending --limit 50
```

Celery recommendation generation tasks live in `apps/recommendations/tasks.py`. Persist long-running job status in `operations.TaskLog` and `recommendations.RecommendationRun`.


## API Documentation

When the API is running:

- Swagger UI: `http://localhost:8000/api/v1/docs/`
- ReDoc: `http://localhost:8000/api/v1/redoc/`
- Schema: `http://localhost:8000/api/v1/schema/`

Primary API route groups:

```text
/api/v1/auth/
/api/v1/users/
/api/v1/user-preferences/
/api/v1/profiles/
/api/v1/profiles/me/interests/
/api/v1/profiles/me/social-links/
/api/v1/books/
/api/v1/book-authors/
/api/v1/book-genres/
/api/v1/related-books/
/api/v1/book-trend-snapshots/
/api/v1/authors/
/api/v1/author-likes/
/api/v1/genres/
/api/v1/reviews/
/api/v1/review-votes/
/api/v1/ratings/
/api/v1/reading-collections/
/api/v1/collection-books/
/api/v1/reading-progress/
/api/v1/follows/
/api/v1/followers/
/api/v1/feed-events/
/api/v1/notifications/
/api/v1/notification-counts/
/api/v1/recommendations/
/api/v1/catalog-recommendations/
/api/v1/recommendation-feedback/
/api/v1/recommendation-models/
/api/v1/recommendation-runs/
/api/v1/search/books/
/api/v1/search/autocomplete/
/api/v1/search/autocomplete-terms/
/api/v1/search/index-statuses/
/api/v1/search/query-logs/
/api/v1/search/throttle-buckets/
/api/v1/external-sources/
/api/v1/external-identifiers/
/api/v1/external-records/
/api/v1/external-enrichment-requests/
/api/v1/external-sync-runs/
/api/v1/external-sync-states/
/api/v1/task-logs/
```

Common detail/action routes:

```text
/api/v1/books/<id>/
/api/v1/books/<book_id>/ratings/
/api/v1/books/<book_id>/reviews/
/api/v1/books/<book_id>/related-books/
/api/v1/authors/<author_id>/books/
/api/v1/genres/<genre_id>/books/
/api/v1/reviews/<review_id>/votes/
/api/v1/recommendations/<id>/dismiss/
/api/v1/recommendations/<id>/click/
/api/v1/notifications/<notification_id>/read/
/api/v1/notifications/<notification_id>/unread/
/api/v1/notifications/mark-all-read/
```

Admin-only operational route groups include `task-logs`, search logs/throttle/index status, external sync/source records, recommendation models/runs, and catalog recommendation writes. User-owned route groups include current profile interests/social links, ratings/reviews, review votes, reading collections/progress, follows, notifications, user recommendations, and recommendation feedback.

The current URL resolver exposes 112 `/api/v1/` routes, including `dj-rest-auth` and schema/docs routes.

## Frontend Integration

The React client in `../client` is the primary consumer of this API. It expects the backend to be available at `http://localhost:8000` during local development unless `VITE_API_BASE_URL` is set for the frontend. The value is read in `client/src/config/env.ts`.

The frontend uses a feature-first source layout:

- React Router DOM route definitions live in `client/src/routes/`; the project does not use TanStack Router or generated route trees.
- Domain pages, hooks, services, components, and types live under `client/src/features/{domain}/`.
- Shared Axios helpers live in `client/src/lib/axios.ts`, and domain API clients call the backend from feature-local service files.

For local browser testing, make sure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` include the active Vite origin, usually:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:5174
```

The current frontend UI uses retryable loading/error states for API-backed books, search results, recommendations, reviews, reading collections, profiles, and notifications.

## Testing And Verification

Run Django system checks with warnings enabled:

```bash
uv run python -Wd manage.py check
```

Verify migration state:

```bash
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py migrate --check
```

Run all tests:

```bash
uv run python manage.py test --verbosity=2
```

Validate OpenAPI generation:

```bash
uv run python manage.py spectacular --validate --file /tmp/booknest-schema.yml
```

Run linting, formatting, and type checks:

```bash
uv run ruff check . --fix
uv run ruff format .
uv run mypy . --ignore-missing-imports
```

Run deploy checks with production settings:

```bash
uv run python manage.py check --deploy --settings=config.settings.production
```

Compile static assets for production:

```bash
uv run python manage.py collectstatic --noinput --settings=config.settings.production
```

The test suite uses Django's test database creation flow. Ensure MariaDB is reachable before running tests.

## Logging

All backend runtime logs should live under:

```text
server/logs/
```

Current log files include:

- `logs/django_debug.log`
- `logs/recommendations.log`
- `logs/booknest_YYYYMMDD.log`
- `logs/booknest_errors_YYYYMMDD.log`

The `logs/` directory and `*.log` files are ignored by Git.

## Background Jobs

Celery is configured in `config/celery.py` and reads settings with the `CELERY_` namespace.

Default periodic task names:

- `sync-external-books`
- `update-book-metadata`

These route to `apps.integrations.tasks`. Recommendation generation uses `apps.recommendations.tasks.generate_recommendations`, search rebuilds use `apps.search.tasks.rebuild_search_index`, and long-running job status should be linked to `operations.TaskLog` where possible.

Run a worker locally when Redis is available:

```bash
uv run celery -A config worker --loglevel=info
```

In Docker, the `celery` service starts a worker automatically.

## Production Checklist

Before deploying:

- Set `DJANGO_SETTINGS_MODULE=config.settings.production`.
- Set `DEBUG=False`.
- Set a long random `SECRET_KEY`.
- Set a `JWT_SIGNING_KEY` of at least 64 bytes for HS512.
- Set production `ALLOWED_HOSTS`.
- Set production `CSRF_TRUSTED_ORIGINS`.
- Set production `CORS_ALLOWED_ORIGINS`.
- Configure MariaDB credentials through environment variables.
- Configure Redis/Celery URLs.
- Configure Cloudinary credentials.
- Configure email credentials if account email flows are used.
- Run migrations.
- Run `uv run python manage.py check --deploy --settings=config.settings.production`.
- Run the full test suite against a reachable MariaDB instance.
- Keep `.env`, logs, local media, and database dumps out of Git.

## Troubleshooting

### MariaDB Connection Refused

Check host and port:

```bash
uv run python -c "import MySQLdb; MySQLdb.connect(host='127.0.0.1', port=3306, user='booknest', passwd='booknest', db='booknest_db').close(); print('ok')"
```

For Docker, inspect service health:

```bash
docker compose ps
docker compose logs db
```

### Port 3306 Already In Use

Another MariaDB/MySQL server may already be bound to the port. Either stop it or set `DB_HOST_PORT` in `.env` to change the Docker Compose host port mapping.

### Production Check Fails On Secret Key

Use a long random `SECRET_KEY` that is not prefixed with `django-insecure-`.

### JWT Warnings With HS512

Use a `JWT_SIGNING_KEY` of at least 64 bytes.

### Logs Appear Outside `server/logs`

Check `DJANGO_LOG_DIR`, `DJANGO_LOG_FILE`, and `RECOMMENDATION_LOG_FILE`. Relative paths are resolved from `server/`.

### Frontend Requests Are Blocked By CORS

Add the active Vite origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`, then restart Django.

## References

- Django deployment checklist: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/
- Django custom management commands: https://docs.djangoproject.com/en/6.0/howto/custom-management-commands/
- Django REST Framework documentation: https://www.django-rest-framework.org/
- HackSoftware Django Styleguide: https://github.com/HackSoftware/Django-Styleguide
- uv projects and commands: https://docs.astral.sh/uv/
- MariaDB Docker image variables: https://mariadb.com/kb/en/mariadb-server-docker-official-image-environment-variables/
