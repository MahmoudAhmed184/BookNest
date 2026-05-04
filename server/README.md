# BookNest Backend

BookNest backend is a Django REST Framework API for book discovery, reading lists, social follows, notifications, and recommendations. The service is organized as a modular Django project with domain apps under `apps/`, split settings under `config/settings/`, MariaDB as the primary database, Redis/Celery for background work, and `uv` for Python dependency and environment management.

## Table Of Contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Docker Development](#docker-development)
- [Database Maintenance](#database-maintenance)
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
| Runtime | Python 3.14.4+ |
| Dependency manager | `uv` with `pyproject.toml` and `uv.lock` |
| Web framework | Django 6.0.4 |
| API | Django REST Framework |
| Auth | `dj-rest-auth`, `django-allauth`, Simple JWT |
| Database | MariaDB via `django.db.backends.mysql` and `mysqlclient` |
| Cache | Redis through `django-redis` |
| Background jobs | Celery with Redis broker/result backend |
| Media | Cloudinary / `django-cloudinary-storage` |
| API schema | `drf-spectacular` |
| Production server dependency | Gunicorn |

## Architecture

The backend follows a domain-app layout:

- `apps/books`: catalog, authors, genres, ratings, reviews, reading lists, search helpers, and integrity maintenance commands.
- `apps/users`: custom user model, profiles, profile interests/social links, auth/profile serializers and views.
- `apps/follows`: follow relationships between profiles.
- `apps/notifications`: notification types, notification creation, unread counts, read/unread actions.
- `apps/recommendation`: recommendation model metadata, generated user recommendations, export/train/generate commands.

Each app follows the same internal layering:

- `models.py` or `models/`: database schema and model-level behavior.
- `managers.py`: custom managers/querysets for reusable ORM behavior.
- `selectors.py`: read/query access paths. Prefer these for list/detail query composition.
- `services.py`: writes/actions/orchestration. Prefer these for business operations.
- `views/` or `views.py`: HTTP-specific request/response handling.
- `serializers/` or `serializers.py`: DRF serialization and validation.
- `tests/`: app-local tests split into `test_models.py`, `test_views.py`, `test_services.py`, and `test_selectors.py`.

Views should stay thin: parse request input, call selectors/services, and return responses. Business logic belongs in services/selectors.

## Repository Layout

```text
server/
├── apps/
│   ├── books/
│   │   ├── management/commands/fix_data_integrity.py
│   │   ├── managers.py
│   │   ├── selectors.py
│   │   ├── services.py
│   │   ├── serializers/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── views/
│   ├── follows/
│   ├── notifications/
│   ├── recommendation/
│   └── users/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── asgi.py
│   ├── celery.py
│   ├── urls.py
│   └── wsgi.py
├── logs/                    # Runtime logs only, ignored by Git
├── media/                   # Local media fallback, ignored by Git
├── .env.example             # Tracked template
├── .python-version          # Python pin
├── Dockerfile
├── docker-compose.yml
├── manage.py
├── pyproject.toml
├── uv.lock
└── wait-for-db.sh
```

## Configuration

Settings modules:

- `config.settings.base`: shared application, database, cache, auth, logging, API, and Celery settings.
- `config.settings.development`: local development defaults, debug enabled, relaxed local security, console email backend by default.
- `config.settings.production`: production security settings and deploy checks.
- `config.settings.testing`: test-specific password hashing, email backend, cache, and media root.

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
| `MARIADB_ROOT_PASSWORD` | Root password used when Docker initializes MariaDB |
| `USE_REDIS_CACHE` | Set `True` to use Redis for Django cache in development; defaults to in-memory cache |
| `REDIS_URL` | Django cache Redis URL when Redis cache is enabled |
| `CELERY_BROKER_URL` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | Celery result backend URL |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `ALLOWED_HOSTS` | Comma-separated Django host allowlist |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted origins |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
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

Repair imported or restored data integrity:

```bash
uv run python manage.py fix_data_integrity --fix-all
```

Start the development server:

```bash
uv run python manage.py runserver
```

Useful local checks:

```bash
uv run python manage.py check
uv run python manage.py test --verbosity=2
```

## Docker Development

Docker Compose starts MariaDB, Redis, Django, and Celery:

```bash
cp .env.example .env
docker compose up --build
```

Services:

| Service | Container | Port | Purpose |
| --- | --- | --- | --- |
| `web` | `booknest_web` | `8000` | Django API |
| `db` | `booknest_db` | `3306` | MariaDB |
| `redis` | `booknest_redis` | `6379` | Cache and broker |
| `celery` | `booknest_celery` | none | Background worker |

Run backend commands in the web container:

```bash
docker compose exec web uv run python manage.py migrate
docker compose exec web uv run python manage.py createsuperuser
docker compose exec web uv run python manage.py check
```

MariaDB data is persisted in the named Docker volume `mariadb_data`.

- `docker compose down` stops containers and keeps data.
- `docker compose down -v` removes volumes and deletes database data.

## Database Maintenance

BookNest uses MariaDB from the start.

Run migrations:

```bash
uv run python manage.py migrate
```

Run data integrity repairs after large imports or restores:

```bash
uv run python manage.py fix_data_integrity --fix-all
```

The integrity command repairs:

- author book counters
- book rating counters and averages
- review vote counters
- missing book genres
- duplicate reading-list entries
- missing user profiles
- MariaDB auto-increment sequences

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

## API Documentation

When the API is running:

- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
- Schema: `http://localhost:8000/schema/`

Primary API route prefixes:

```text
/api/users/
/api/books/
/api/follow/
/api/notifications/
/api/recommendation/
```

## Frontend Integration

The React client in `../client` is the primary consumer of this API. It expects the backend to be available at `http://localhost:8000` during local development unless `client/src/config/index.ts` is changed.

For local browser testing, make sure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` include the active Vite origin, usually:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:5174
```

The current frontend UI uses retryable loading/error states for API-backed books, search results, recommendations, reviews, reading lists, profiles, and notifications.

## Testing And Verification

Run all tests:

```bash
uv run python manage.py test --verbosity=2
```

Run Django system checks:

```bash
uv run python manage.py check
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
- `logs/recommendation.log`
- `logs/booknest_YYYYMMDD.log`
- `logs/booknest_errors_YYYYMMDD.log`

The `logs/` directory and `*.log` files are ignored by Git.

## Background Jobs

Celery is configured in `config/celery.py` and reads settings with the `CELERY_` namespace.

Default periodic task names:

- `sync-external-books`
- `update-book-metadata`

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

Another MariaDB/MySQL server may already be bound to the port. Either stop it or change the Docker Compose port mapping.

### Production Check Fails On Secret Key

Use a long random `SECRET_KEY` that is not prefixed with `django-insecure-`.

### JWT Warnings With HS512

Use a `JWT_SIGNING_KEY` of at least 64 bytes.

### Logs Appear Outside `server/logs`

Check `DJANGO_LOG_DIR`, `DJANGO_LOG_FILE`, and `RECOMMENDATION_LOG_FILE`. Relative paths are resolved from `server/`.

## References

- Django deployment checklist: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/
- Django custom management commands: https://docs.djangoproject.com/en/6.0/howto/custom-management-commands/
- uv projects and commands: https://docs.astral.sh/uv/
- MariaDB Docker image variables: https://mariadb.com/kb/en/mariadb-server-docker-official-image-environment-variables/
