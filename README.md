# BookNest

BookNest is a full-stack book discovery and reading community application. It combines a Django REST Framework API with a strict TypeScript React frontend so users can discover books, manage profiles, build reading collections, publish ratings and reviews, follow other readers, and receive notifications.

The repository is organized as a two-application workspace:

- `server/`: Django backend, MariaDB persistence, Redis/Celery background work, JWT authentication, Cloudinary media storage, and OpenAPI documentation.
- `client/`: React 19, Vite 8, TypeScript 6 frontend with feature-first folders, typed API services, route-level code splitting, strict type checking, and Vitest smoke tests.

## Current Stack

### Backend

| Area | Technology |
| --- | --- |
| Runtime | Python 3.14.4+ managed by `uv` |
| Web framework | Django 6.0.4 |
| API | Django REST Framework, `drf-spectacular` |
| Auth | `dj-rest-auth`, `django-allauth`, Simple JWT |
| Database | MariaDB via `django.db.backends.mysql` and `mysqlclient` |
| Cache and queue | Redis, Celery |
| Media | Cloudinary via `django-cloudinary-storage` |
| Production server | Gunicorn, WhiteNoise |
| Tests | Django test runner, pytest, pytest-django, coverage |

### Frontend

| Area | Technology |
| --- | --- |
| UI runtime | React 19.2.5, React DOM 19.2.5 |
| Language | TypeScript 6.0.3 with strict mode |
| Build tool | Vite 8.0.10, `@vitejs/plugin-react` 6.0.1 |
| Routing | React Router DOM 7 |
| Data fetching | TanStack Query 5, Axios |
| Forms | Formik, Yup |
| Styling | Tailwind CSS 3, global CSS, Montserrat font assets |
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
|   |-- public/
|   `-- src/
|       |-- assets/
|       |-- components/
|       |-- config/
|       |-- features/
|       |-- hooks/
|       |-- layouts/
|       |-- pages/
|       |-- services/
|       |-- store/
|       |-- styles/
|       |-- types/
|       |-- utils/
|       |-- app.tsx
|       |-- index.tsx
|       `-- router.tsx
|-- server/
|   |-- README.md
|   |-- manage.py
|   |-- pyproject.toml
|   |-- uv.lock
|   |-- docker-compose.yml
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
|-- docs/
```

## Architecture Notes

### Backend

Backend code is split by domain app under `server/apps/`. The backend follows a service and selector pattern:

- `services.py`: write operations, state changes, orchestration, and side effects.
- `selectors.py`: read operations and query composition.
- `managers.py`: reusable queryset and model manager behavior.
- `tests/`: focused model, view, service, and selector coverage.

The Django settings are split by environment:

- `config.settings.development`
- `config.settings.testing`
- `config.settings.production`

### Frontend

Frontend code is TypeScript-first and organized around the current feature-first structure:

- Shared UI lives in `client/src/components/`.
- Route pages live in `client/src/pages/` and are grouped by domain.
- Domain-specific feature folders live in `client/src/features/`.
- API calls live in `client/src/services/`.
- Shared request and response contracts live in `client/src/types/`.
- Global state lives in `client/src/store/`.
- App configuration lives in `client/src/config/`.

The frontend has strict TypeScript enabled with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. No `.js` or `.jsx` files remain under `client/src/`.

## Prerequisites

Backend:

- Python 3.14.4+
- `uv`
- MariaDB 11+ for native local development, or Docker Compose
- Redis for cache and Celery if running background tasks locally

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
uv run python manage.py seed_database
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
docker compose exec web uv run python manage.py seed_database
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

The frontend API base URL is defined in `client/src/config/index.ts` and currently points to `http://localhost:8000`. Run the backend before using pages that fetch API data.

## Seed Data

The backend includes an idempotent seed command:

```bash
cd server
uv run python manage.py seed_database
```

It creates or updates:

- demo admin account
- demo users and profiles
- genres, authors, and books
- reading lists
- ratings and reviews
- follows
- notifications
- recommendations

Seed credentials are controlled by these `server/.env` values:

```dotenv
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@booknest.local
SEED_ADMIN_PASSWORD=change-me-admin-password
SEED_USER_PASSWORD=change-me-demo-user-password
```

## Environment Files

`server/.env` is ignored and must not be committed. Use `server/.env.example` as the template.

Important backend variables:

- `DJANGO_SETTINGS_MODULE`
- `SECRET_KEY`
- `JWT_SIGNING_KEY`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `MARIADB_ROOT_PASSWORD`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `FRONTEND_URL`, `SITE_NAME`
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD`

The frontend does not currently require a local `.env` file. API configuration is centralized in `client/src/config/index.ts`.

## API Documentation

When the backend is running:

- API root: `http://localhost:8000/`
- Swagger UI: `http://localhost:8000/swagger/`
- OpenAPI schema: generated by `drf-spectacular`

## Verification

Backend:

```bash
cd server
uv sync
uv run python manage.py check
uv run python manage.py test --verbosity=2
uv run python manage.py check --deploy --settings=config.settings.production
```

Frontend:

```bash
cd client
npx tsc --noEmit
npm run build
npm test
npm run lint
```

Current frontend verification:

- `npx tsc --noEmit` exits 0.
- `npm run build` exits 0 with no warnings.
- `npm test` exits 0.
- Source files under `client/src/` are TypeScript and TSX only.

## Production Notes

- Use `DJANGO_SETTINGS_MODULE=config.settings.production` for backend deployments.
- Keep `server/.env` out of Git.
- Use strong, unique `SECRET_KEY` and `JWT_SIGNING_KEY` values.
- Set real `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- Run Django deployment checks before release.
- Build the frontend with `npm run build` and serve `client/dist/` through the chosen hosting layer.
- Review `npm audit` and Python dependency advisories before production releases.
- Rotate any secret that was ever committed or shared outside the deployment environment.

## Related Documentation

- Frontend details: `client/README.md`
- Backend details: `server/README.md`
- Frontend structure reference: `docs/frontend_structure.md`
- Backend structure reference: `docs/backend_structure.md`

## External References

- GitHub README documentation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- Django deployment checklist: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/
- uv documentation: https://docs.astral.sh/uv/
- Vite guide: https://vite.dev/guide/
- React TypeScript guide: https://react.dev/learn/typescript
