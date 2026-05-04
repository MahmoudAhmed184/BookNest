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
| Styling | Tailwind CSS 4, global CSS |
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
|-- app/
|   |-- App.tsx
|   `-- providers.tsx
|-- assets/
|-- components/
|   |-- layout/
|   |   |-- ErrorBoundary/
|   |   |-- Footer/
|   |   |-- Layout/
|   |   `-- Navbar/
|   `-- ui/
|       |-- BookCard/
|       |-- BookCardSkeleton/
|       |-- EmptyState/
|       |-- ErrorState/
|       |-- FieldError/
|       `-- InlineSpinner/
|-- config/
|   `-- env.ts
|-- features/
|   |-- auth/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- store/
|   |   |-- types/
|   |   `-- index.ts
|   |-- catalog/
|   |   |-- components/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|   |   `-- index.ts
|   |-- collections/
|   |-- errors/
|   |-- home/
|   |-- notifications/
|   |-- profile/
|   `-- settings/
|-- hooks/
|-- lib/
|   |-- axios.ts
|   `-- queryClient.ts
|-- routes/
|   |-- AppRouter.tsx
|   |-- index.ts
|   `-- paths.ts
|-- services/
|-- store/
|-- styles/
|   |-- App.css
|   `-- index.css
|-- types/
|   `-- api.ts
|-- utils/
|-- main.tsx
`-- vite-env.d.ts
```

## Architecture

### Application Entry

- `src/main.tsx` mounts the app with React DOM `createRoot`.
- `src/app/App.tsx` returns the router.
- `src/app/providers.tsx` composes application providers.
- `src/routes/AppRouter.tsx` owns the React Router DOM route table and lazy-loads page modules through React `lazy` and `Suspense`.
- `src/components/layout/Layout/Layout.tsx` provides the persistent shell with `Navbar`, global toast configuration, an error boundary, page outlet, and `Footer`.

### Routing

Current routes:

| Path | Page |
| --- | --- |
| `/` | `features/home/pages/LandingPage.tsx` |
| `/login` | `features/auth/pages/LoginPage.tsx` |
| `/register` | `features/auth/pages/RegisterPage.tsx` |
| `/resetpassword` | `features/auth/pages/ResetPasswordPage.tsx` |
| `/explore` | `features/catalog/pages/ExplorePage.tsx` |
| `/search` | `features/catalog/pages/SearchPage.tsx` |
| `/search/:query` | `features/catalog/pages/SearchPage.tsx` |
| `/author` | `features/catalog/pages/AuthorPage.tsx` |
| `/profile/me` | `features/profile/pages/ProfilePage.tsx` |
| `/profile/:id` | `features/profile/pages/UserProfilePage.tsx` |
| `/categories` | `features/catalog/pages/CategoriesPage.tsx` |
| `/feed` | `features/catalog/pages/FeedPage.tsx` |
| `/settings` | `features/settings/pages/SettingsPage.tsx` |
| `/book/:id` | `features/catalog/pages/BookPage.tsx` |
| `/notifications` | `features/notifications/pages/NotificationsPage.tsx` |
| `*` | `features/errors/pages/NotFoundPage.tsx` |

Route paths and builders live in `src/routes/paths.ts`. Routing uses React Router DOM; the project does not use TanStack Router or generated route trees.

### API Layer

Axios setup and typed request helpers live in `src/lib/axios.ts`. Domain API calls live with their feature.

- `features/auth/services/authService.ts` handles login, registration, and profile creation calls.
- `features/catalog/services/bookService.ts` handles book, search, review, rating, and recommendation calls.
- `features/collections/services/collectionService.ts` handles reading collections.
- `features/notifications/services/notificationService.ts` handles notifications.
- `features/profile/services/userService.ts` handles profile and settings-backed user requests.

Shared API envelopes live under `src/types/`. Feature-specific request and response contracts live under `features/{domain}/types/`. Service files avoid `any`; unknown API errors are narrowed through helper functions in `src/lib/axios.ts`.

### State

Auth state lives in `src/features/auth/store/AuthContext.tsx`. The root `src/store/` folder is reserved for cross-feature client state only.

The auth context tracks:

- whether a user is authenticated
- the current access token
- login state updates
- logout behavior

The token is read from and written to `localStorage`. Authenticated service calls use bearer headers from `src/lib/axios.ts`.

### UI and Styling

Styling is split between:

- `src/styles/index.css`: Tailwind v4 theme tokens, global element styles, theme utilities, and shared visual primitives.
- `src/styles/App.css`: reserved stylesheet placeholder retained from the existing project.
- `@fontsource/montserrat`: local font package imports in `src/main.tsx`.

Tailwind configuration is CSS-first through `@theme` and `@utility` in `src/styles/index.css`. The current palette is defined there and should not be duplicated or changed in page files.

The shared UI primitives added in the latest pass are:

- `BookCard`: cover-first accessible book card with hover lift, cover fallback initials, lazy image loading, and truncated title support.
- `BookCardSkeleton`: card-matching skeleton layout with shimmer animation.
- `EmptyState`: reusable warm empty state with icon, copy, and optional CTA.
- `ErrorState`: reusable inline error state with retry support.
- `FieldError`: accessible inline form error with warning icon.
- `InlineSpinner`: small submit/progress indicator for buttons.
- `ErrorBoundary`: graceful runtime fallback wrapper used by `Layout`.

Global UX behavior now includes:

- `animate-fade-up` page entry motion.
- `animate-shimmer` skeleton loading.
- consistent focus-visible outlines and 44px touch targets on small controls.
- reduced-motion media query support.
- globally configured React Hot Toast duration, position, icons, and ARIA status behavior.

Data-backed pages use TanStack Query loading, fetching, error, and retry states instead of blank screens or standalone spinners. Search has a 300ms debounce, clear action, results count, active sort controls, accessible combobox attributes, and scroll restoration when returning from a book page.

### Testing

The frontend uses Vitest with jsdom and React Testing Library.

Current test files:

```text
src/features/home/pages/LandingPage.test.tsx
src/features/auth/hooks/authHooks.test.tsx
src/features/catalog/hooks/catalogHooks.test.tsx
src/features/profile/hooks/profileHooks.test.tsx
src/test/QueryBackedPages.test.tsx
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
npm run lint
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

- Keep reusable, generic UI in `src/components/ui/`.
- Keep app shell components in `src/components/layout/`.
- Keep route-level views inside `src/features/{domain}/pages/`.
- Keep domain-specific hooks, services, types, data, and components in `src/features/{domain}/`.
- Keep shared infrastructure wrappers in `src/lib/`.
- Keep root `src/services/`, `src/store/`, `src/hooks/`, and `src/types/` for cross-feature concerns only.
- Keep app-level config in `src/config/`.
- Prefer typed `Props` interfaces and explicit component return types.
- Avoid `any`; use `unknown` with runtime narrowing when a value is genuinely unknown.
- Use shared `BookCard`, `BookCardSkeleton`, `EmptyState`, `ErrorState`, `FieldError`, and `InlineSpinner` before adding page-local variants.
- Preserve the existing color palette in `src/styles/index.css`; do not introduce one-off hex colors in page markup.
- Keep API calls in feature services; UI pages should consume existing service functions through TanStack Query hooks or mutations.

## Troubleshooting

### The page renders but data stays loading

Start the backend on `http://localhost:8000` and make sure its database is migrated:

```bash
cd ../server
uv run python manage.py migrate
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
