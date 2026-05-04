# BookNest Backend

This is the Django backend for BookNest. It uses `uv`, Python 3.14.4+, Django 6.0.4, MariaDB, Redis, Celery, Django REST Framework, JWT auth, Cloudinary media storage, and `drf-spectacular` API docs.

## Structure

```text
server/
├── apps/
│   ├── books/
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
│   ├── urls.py
│   ├── asgi.py
│   ├── celery.py
│   └── wsgi.py
├── pyproject.toml
├── uv.lock
├── docker-compose.yml
└── manage.py
```

Each app has:

- `services.py`: writes, actions, orchestration
- `selectors.py`: reads and query composition
- `managers.py`: reusable queryset/manager behavior
- `tests/`: `test_models.py`, `test_views.py`, `test_services.py`, `test_selectors.py`

## Environment

Create a local env file from the tracked template:

```bash
cp .env.example .env
```

`server/.env` is ignored and must not be committed.

For Docker Compose, keep:

```dotenv
DB_HOST=db
DB_PORT=3306
```

For native local MariaDB, use:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
```

Important variables:

- `DJANGO_SETTINGS_MODULE`
- `SECRET_KEY`
- `JWT_SIGNING_KEY`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `MARIADB_ROOT_PASSWORD`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ALLOWED_HOSTS`
- `CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_PASSWORD`

## Local Setup

```bash
uv sync
uv run python manage.py migrate
uv run python manage.py seed_database
uv run python manage.py runserver
```

The API runs at `http://localhost:8000/`.

## Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

Services:

- `web`: Django API on port `8000`
- `db`: MariaDB on port `3306`
- `redis`: Redis on port `6379`
- `celery`: background worker

Run Django commands inside the web container:

```bash
docker compose exec web uv run python manage.py migrate
docker compose exec web uv run python manage.py seed_database
docker compose exec web uv run python manage.py createsuperuser
docker compose exec web uv run python manage.py check
```

MariaDB data is persisted in the `mariadb_data` Docker volume. `docker compose down` keeps it; `docker compose down -v` deletes it.

## Seed Command

```bash
uv run python manage.py seed_database
```

The command is idempotent. It creates or updates:

- demo admin account
- demo users and profiles
- genres, authors, and books
- reading lists
- ratings and reviews
- follows
- notifications
- recommendations

Seed credentials come from `SEED_*` env vars.

## Useful Commands

```bash
uv sync
uv run python manage.py check
uv run python manage.py migrate
uv run python manage.py test --verbosity=2
uv run python manage.py check --deploy --settings=config.settings.production
uv run python manage.py collectstatic --noinput --settings=config.settings.production
```

## API Docs

When the server is running:

- Swagger UI: `http://localhost:8000/swagger/`
- API schema generation is handled by `drf-spectacular`.

## Production Notes

- Use MariaDB for the backend database.
- Use `DJANGO_SETTINGS_MODULE=config.settings.production`.
- Set a strong `SECRET_KEY`.
- Set a `JWT_SIGNING_KEY` of at least 64 bytes for HS512.
- Configure real host/origin values for `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- Run `uv run python manage.py check --deploy --settings=config.settings.production` before release.
