# BookNest

BookNest is a full-stack book discovery and reading community application. It combines a Django REST Framework API with a strict TypeScript React frontend so readers can discover books, maintain profiles and reading lists, publish ratings and reviews, follow other readers, and receive notifications and recommendations.

The repository is a two-application workspace:

- `server/`: Django 6 backend with MariaDB persistence, Redis/Celery background work, JWT authentication, Cloudinary media storage, and OpenAPI documentation.
- `client/`: React 19 and Vite 8 frontend with strict TypeScript, feature-first source folders, typed API services, React Router DOM routing, TanStack Query, and Vitest tests.

## Current Stack

### Backend

| Area | Technology |
| --- | --- |
| Runtime | Python 3.14.4 managed by `uv` |
| Web framework | Django 6.0.4 |
| API | Django REST Framework 3.17.1, `drf-spectacular` |
| Auth | `dj-rest-auth`, `django-allauth`, Simple JWT |
| Database | MariaDB through `django.db.backends.mysql` and `mysqlclient` |
| Cache and queue | Redis, `django-redis`, Celery |
| Media | Cloudinary through `django-cloudinary-storage` |
| Production server | Gunicorn, WhiteNoise |
| Quality gates | Django test runner, pytest, coverage, Ruff, mypy, django-stubs |

### Frontend

| Area | Technology |
| --- | --- |
| UI runtime | React 19.2.5, React DOM 19.2.5 |
| Language | TypeScript 6.0.3 with strict mode |
| Build tool | Vite 8.0.10, `@vitejs/plugin-react` 6.0.1 |
| Routing | React Router DOM 7 |
| Data fetching | TanStack Query 5, Axios |
| Forms | Formik, Yup |
| Styling | Tailwind CSS 4, global CSS, Montserrat font assets |
| Feedback and UI helpers | React Hot Toast, Swiper |
| Tests | Vitest 4, React Testing Library, jsdom |

## Repository Layout

```text
BookNest/
|-- README.md
|-- client/
|   |-- README.md
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   |-- tsconfig.json
|   |-- vercel.json
|   |-- public/
|   `-- src/
|       |-- app/
|       |-- assets/
|       |-- components/
|       |   |-- layout/
|       |   `-- ui/
|       |-- config/
|       |-- features/
|       |-- hooks/
|       |-- lib/
|       |-- routes/
|       |-- services/
|       |-- store/
|       |-- styles/
|       |-- test/
|       |-- types/
|       |-- utils/
|       `-- main.tsx
|-- server/
|   |-- README.md
|   |-- Dockerfile
|   |-- docker-compose.yml
|   |-- manage.py
|   |-- pyproject.toml
|   |-- uv.lock
|   |-- wait-for-db.sh
|   |-- apps/
|   |   |-- books/
|   |   |-- follows/
|   |   |-- notifications/
|   |   |-- recommendation/
|   |   `-- users/
|   `-- config/
|       |-- urls.py
|       |-- asgi.py
|       |-- celery.py
|       |-- wsgi.py
|       `-- settings/
```

## Architecture

Backend code is split into domain apps under `server/apps/`. Each app keeps HTTP handling, read access, and business operations separate:

- `views.py` or `views/`: parse requests, call selectors/services, and return DRF responses.
- `selectors.py`: read/query access paths and queryset composition.
- `services.py`: write operations, state changes, orchestration, and side effects.
- `managers.py`: reusable queryset and model manager behavior.
- `tests/`: app-local model, selector, service, and view coverage.

Public API routes are versioned under `/api/v1/`. OpenAPI schema and docs are also versioned:

- Swagger UI: `http://localhost:8000/api/v1/docs/`
- ReDoc: `http://localhost:8000/api/v1/redoc/`
- Schema: `http://localhost:8000/api/v1/schema/`

Frontend code is TypeScript-first and feature-first:

- App entry and providers live in `client/src/main.tsx` and `client/src/app/`.
- React Router DOM route definitions live in `client/src/routes/`.
- Route pages, hooks, services, components, and feature types live under `client/src/features/{domain}/`.
- Shared UI primitives live in `client/src/components/ui/`.
- App shell components live in `client/src/components/layout/`.
- Axios and TanStack Query infrastructure live in `client/src/lib/`.
- App configuration lives in `client/src/config/env.ts`.

The frontend source tree is TS/TSX-only under `client/src/`.

## Prerequisites

Backend:

- Python 3.14.4
- `uv`
- MariaDB 11+ for native local development, or Docker Compose
- Redis when running Celery or Redis-backed cache locally

Frontend:

- Node.js 20.19+, 22.13+, or 24+
- npm

## Backend Setup

### Native Local Development

```bash
cd server
uv sync
cp .env.example .env
```

For native MariaDB, update `server/.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=booknest_db
DB_USER=booknest
DB_PASSWORD=your_secure_password_here
```

Then run:

```bash
uv run python manage.py migrate
uv run python manage.py runserver
```

The API runs at `http://localhost:8000/`.

### Docker Development

```bash
cd server
cp .env.example .env
docker compose up --build
```

Docker Compose starts:

- `web`: Django API on port `8000`
- `db`: MariaDB on port `3306`
- `redis`: Redis on port `6379`
- `celery`: background worker

Run Django commands inside the web container:

```bash
docker compose exec web uv run python manage.py migrate
docker compose exec web uv run python manage.py createsuperuser
docker compose exec web uv run python manage.py check
```

MariaDB data is stored in the `mariadb_data` Docker volume. `docker compose down` keeps the data. `docker compose down -v` deletes it.

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173/`.

The frontend API base URL is read from `VITE_API_BASE_URL` in `client/src/config/env.ts` and defaults to `http://localhost:8000`. Run the backend before using API-backed pages.

## Environment Files

`server/.env` is ignored and must not be committed. Use `server/.env.example` as the template.

Important backend variables:

- `DJANGO_SETTINGS_MODULE`
- `DEBUG`
- `SECRET_KEY`
- `JWT_SIGNING_KEY`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `MARIADB_ROOT_PASSWORD`
- `USE_REDIS_CACHE`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `FRONTEND_URL`, `SITE_NAME`
- `DJANGO_LOG_DIR`, `DJANGO_LOG_FILE`, `RECOMMENDATION_LOG_FILE`

The frontend does not require a local `.env` file unless overriding the API origin:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

## API Routes

Primary local route groups:

```text
/api/v1/auth/
/api/v1/users/
/api/v1/profiles/
/api/v1/books/
/api/v1/authors/
/api/v1/genres/
/api/v1/feed-activities/
/api/v1/reviews/
/api/v1/ratings/
/api/v1/reading-lists/
/api/v1/follows/
/api/v1/notifications/
/api/v1/notification-types/
/api/v1/notification-counts/
/api/v1/recommendations/
/api/v1/recommendation-refreshes/
/api/v1/recommendation-models/
```

## Maintenance Commands

Backend data maintenance:

```bash
cd server
uv run python manage.py fix_data_integrity --fix-all --dry-run
uv run python manage.py fix_data_integrity --fix-all
uv run python manage.py rebuild_book_search_index
```

Recommendation commands:

```bash
cd server
uv run python manage.py train_recommendation_model --model-type svd
uv run python manage.py generate_recommendations --all
```

Create local MariaDB backups with `mariadb-dump` after running migrations and any data integrity repairs:

```bash
cd server
set -a
. ./.env
set +a
mkdir -p backups
MYSQL_PWD="$DB_PASSWORD" mariadb-dump --single-transaction --quick \
  --routines --triggers --events -u "$DB_USER" "$DB_NAME" \
  > backups/booknest_mariadb_clean.sql
```

Database dumps are ignored by Git and should be stored securely because they may contain user data and password hashes.

## Verification

Backend:

```bash
cd server
uv run python -Wd manage.py check
uv run python manage.py test --verbosity=2
uv run ruff check . --fix
uv run ruff format .
uv run mypy . --ignore-missing-imports
uv run python manage.py check --deploy --settings=config.settings.production
```

Frontend:

```bash
cd client
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Production Notes

- Use `DJANGO_SETTINGS_MODULE=config.settings.production` for backend deployments.
- Keep `server/.env`, logs, local media, and database dumps out of Git.
- Use strong, unique `SECRET_KEY` and `JWT_SIGNING_KEY` values.
- Set real `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- Configure MariaDB, Redis/Celery, Cloudinary, and email credentials through environment variables.
- Run migrations and Django deployment checks before release.
- Build the frontend with `npm run build` and serve `client/dist/` through the chosen hosting layer.
- Review `npm audit` and Python dependency advisories before production releases.

## Related Documentation

- Backend details: `server/README.md`
- Frontend details: `client/README.md`
- Books management commands: `server/apps/books/management/commands/README.md`

## External References

- GitHub README documentation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- Django deployment checklist: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/
- Django custom management commands: https://docs.djangoproject.com/en/6.0/howto/custom-management-commands/
- Django REST Framework documentation: https://www.django-rest-framework.org/
- uv documentation: https://docs.astral.sh/uv/
- Vite guide: https://vite.dev/guide/
- React TypeScript guide: https://react.dev/learn/typescript
