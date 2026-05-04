# BookNest Frontend

This is the React frontend for BookNest. It is a Vite-powered TypeScript application that connects to the Django API in `../server`, renders the reader-facing web experience, and keeps API, route, state, and type boundaries explicit.

The frontend uses a feature-first structure with strict TypeScript, typed Axios services, route-level code splitting, and a Vite-native test command.

## Stack

| Area | Technology |
| --- | --- |
| Runtime UI | React 19.2.5, React DOM 19.2.5 |
| Language | TypeScript 6.0.3 |
| Build tool | Vite 8.0.10 |
| React plugin | `@vitejs/plugin-react` 6.0.1 |
| Routing | React Router DOM 7 |
| Server state | TanStack Query 5 |
| HTTP client | Axios |
| Forms | Formik, Yup |
| Styling | Tailwind CSS 3, global CSS |
| Fonts | `@fontsource/montserrat` |
| Notifications | React Hot Toast |
| Carousel | Swiper |
| Tests | Vitest 4, React Testing Library, jsdom |

## Requirements

- Node.js 20.19+, 22.13+, or 24+
- npm
- BookNest backend running at `http://localhost:8000` for API-backed pages

The Node.js requirement comes from the current Vite, Vitest, and jsdom versions used by this package.

## Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

For a complete local application, start the backend from the repository root:

```bash
cd ../server
uv sync
cp .env.example .env
uv run python manage.py migrate
uv run python manage.py seed_database
uv run python manage.py runserver
```

The frontend API base URL is defined in `src/config/index.ts`:

```ts
export const API_BASE_URL = "http://localhost:8000";
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the frontend project. |
| `npm test` | Run Vitest tests in jsdom. |
| `npx tsc --noEmit` | Run TypeScript checking without emitting files. |

## Project Structure

```text
src/
|-- assets/
|   |-- .gitkeep
|   `-- react.svg
|-- components/
|   |-- Footer.tsx
|   `-- Navbar.tsx
|-- config/
|   `-- index.ts
|-- features/
|   |-- auth/
|   |-- catalog/
|   `-- profile/
|-- hooks/
|-- layouts/
|   `-- Layout.tsx
|-- pages/
|   |-- Auth/
|   |   |-- LoginPage.tsx
|   |   |-- RegisterPage.tsx
|   |   `-- ResetPasswordPage.tsx
|   |-- Catalog/
|   |   |-- AuthorPage.tsx
|   |   |-- BookPage.tsx
|   |   |-- CategoriesPage.tsx
|   |   |-- ExplorePage.tsx
|   |   |-- FeedPage.tsx
|   |   `-- SearchPage.tsx
|   |-- Errors/
|   |   `-- NotFoundPage.tsx
|   |-- Home/
|   |   |-- LandingPage.test.tsx
|   |   `-- LandingPage.tsx
|   `-- Profile/
|       |-- NotificationsPage.tsx
|       |-- ProfilePage.tsx
|       |-- SettingsPage.tsx
|       `-- UserProfilePage.tsx
|-- services/
|   |-- apiClient.ts
|   |-- authService.ts
|   |-- bookService.ts
|   |-- collectionService.ts
|   |-- notificationService.ts
|   `-- userService.ts
|-- store/
|   `-- AuthContext.tsx
|-- styles/
|   |-- App.css
|   `-- index.css
|-- types/
|   |-- api.ts
|   |-- auth.ts
|   |-- book.ts
|   |-- collection.ts
|   |-- notification.ts
|   `-- user.ts
|-- utils/
|-- app.tsx
|-- index.tsx
|-- router.tsx
`-- vite-env.d.ts
```

## Architecture

### Application Entry

- `src/index.tsx` mounts the app with React DOM `createRoot`.
- `src/app.tsx` returns the router.
- `src/router.tsx` owns the route table and lazy-loads page modules through React `lazy` and `Suspense`.
- `src/layouts/Layout.tsx` provides the persistent shell with `Navbar`, page outlet, and `Footer`.

### Routing

Current routes:

| Path | Page |
| --- | --- |
| `/` | `pages/Home/LandingPage.tsx` |
| `/login` | `pages/Auth/LoginPage.tsx` |
| `/register` | `pages/Auth/RegisterPage.tsx` |
| `/resetpassword` | `pages/Auth/ResetPasswordPage.tsx` |
| `/explore` | `pages/Catalog/ExplorePage.tsx` |
| `/search` | `pages/Catalog/SearchPage.tsx` |
| `/search/:query` | `pages/Catalog/SearchPage.tsx` |
| `/author` | `pages/Catalog/AuthorPage.tsx` |
| `/profile/me` | `pages/Profile/ProfilePage.tsx` |
| `/profile/:id` | `pages/Profile/UserProfilePage.tsx` |
| `/categories` | `pages/Catalog/CategoriesPage.tsx` |
| `/feed` | `pages/Catalog/FeedPage.tsx` |
| `/settings` | `pages/Profile/SettingsPage.tsx` |
| `/book/:id` | `pages/Catalog/BookPage.tsx` |
| `/notifications` | `pages/Profile/NotificationsPage.tsx` |
| `*` | `pages/Errors/NotFoundPage.tsx` |

The route path union in `src/router.tsx` keeps route definitions typed and centralized.

### API Layer

All Axios calls are isolated under `src/services/`.

- `apiClient.ts` creates the shared Axios client and typed helpers.
- `authService.ts` handles login, registration, and password reset calls.
- `bookService.ts` handles book, category, author, search, feed, and interaction calls.
- `collectionService.ts` handles reading collections.
- `notificationService.ts` handles notifications.
- `userService.ts` handles profile and settings requests.

Shared request and response contracts live under `src/types/`. Service files avoid `any`; unknown API errors are narrowed through helper functions in `apiClient.ts`.

### State

Global frontend state currently lives in `src/store/AuthContext.tsx`.

The auth context tracks:

- whether a user is authenticated
- the current access token
- login state updates
- logout behavior

The token is read from and written to `localStorage`. Authenticated service calls use bearer headers from `apiClient.ts`.

### Styling

Styling is split between:

- `src/styles/index.css`: Tailwind layers, global element styles, theme utilities, and shared visual primitives.
- `src/styles/App.css`: reserved stylesheet placeholder retained from the existing project.
- `tailwind.config.js`: Tailwind theme extension and scan configuration.
- `@fontsource/montserrat`: local font package imports in `src/index.tsx`.

The current styling preserves the existing visual appearance and UX.

### Testing

The frontend uses Vitest with jsdom and React Testing Library.

Current test file:

```text
src/pages/Home/LandingPage.test.tsx
```

Run tests:

```bash
npm test
```

The smoke test verifies that the landing page renders its primary heading and navigation links.

## TypeScript

Strict TypeScript is enabled in `tsconfig.json`:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

The frontend source tree is TS/TSX-only. No `.js` or `.jsx` files should be added under `src/`.

Before committing frontend changes, run:

```bash
npx tsc --noEmit
npm run build
npm test
```

## Build and Preview

Create a production build:

```bash
npm run build
```

Preview the built app:

```bash
npm run preview
```

The production build is emitted to `dist/`.

## Development Conventions

- Keep reusable, generic UI in `src/components/`.
- Keep route-level views in `src/pages/`, grouped by domain.
- Keep domain-specific implementation details in `src/features/{domain}/`.
- Keep API calls in `src/services/`; keep shared data contracts in `src/types/`.
- Keep global state in `src/store/`.
- Keep app-level config in `src/config/`.
- Prefer typed `Props` interfaces and explicit component return types.
- Avoid `any`; use `unknown` with runtime narrowing when a value is genuinely unknown.
- Do not change page appearance or UX during structural changes unless the product change explicitly calls for it.

## Troubleshooting

### The page renders but data stays loading

Start the backend on `http://localhost:8000` and make sure its database is migrated and seeded:

```bash
cd ../server
uv run python manage.py migrate
uv run python manage.py seed_database
uv run python manage.py runserver
```

### Vite refuses to start because of Node.js

Use Node.js 20.19+, 22.13+, or 24+. Older Node.js versions are outside the engine range for the current frontend toolchain.

### API requests go to the wrong host

Update `src/config/index.ts`:

```ts
export const API_BASE_URL = "http://localhost:8000";
```

If the backend is deployed elsewhere, point that constant at the deployed API origin.

## Related Documentation

- Root project README: `../README.md`
- Backend README: `../server/README.md`
- Frontend structure reference: `../docs/frontend_structure.md`
