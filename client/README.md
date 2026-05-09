# BookNest Frontend

## Project Overview

BookNest frontend is a React/Vite single-page application for the BookNest reader and staff web interface. It turns the Django API into authenticated user flows for catalog discovery, search, book details, reviews, ratings, collections, follows, notifications, settings, and staff catalog/recommendation administration for readers and administrators.

## Tech Stack

Versions below reflect both the version spec declared in `package.json` and the currently locked install in `package-lock.json`. `npm ci` uses the locked version.

| Area | Package | package.json | Locked | Role in this project |
| --- | --- | --- | --- | --- |
| Runtime UI | `react` | `19.2.5` | `19.2.5` | Component model, hooks, suspense, context, and JSX runtime. |
| Runtime UI | `react-dom` | `19.2.5` | `19.2.5` | Mounts the React app in `src/main.tsx` with `createRoot`. |
| Routing | `react-router-dom` | `^7.1.3` | `7.15.0` | Browser routing, nested routes, route guards, navigation, route params, and lazy page rendering. |
| Server state | `@tanstack/react-query` | `^5.80.2` | `5.80.2` | Query/mutation cache used by feature hooks for API-backed pages. |
| HTTP | `axios` | `^1.9.0` | `1.16.0` | Shared API client, auth headers, token refresh, and typed request helpers in `src/lib/axios.ts`. |
| Forms | `formik` | `^2.4.6` | `2.4.6` | Form state for the auth pages. |
| Validation | `yup` | `^1.6.1` | `1.6.1` | Auth form schemas in `src/features/auth/pages/*.schema.ts`. |
| Styling | `tailwindcss` | `^4.2.4` | `4.2.4` | CSS-first Tailwind utilities, theme tokens, and custom utilities in `src/styles/index.css`. |
| Styling | `@tailwindcss/vite` | `^4.2.4` | `4.2.4` | Tailwind CSS Vite plugin registered in `vite.config.js`. |
| Fonts | `@fontsource/montserrat` | `^5.2.5` | `5.2.5` | Self-hosted body font imported in `src/main.tsx`. |
| Fonts | `@fontsource/playfair-display` | `^5.2.8` | `5.2.8` | Self-hosted display font imported in `src/main.tsx`. |
| Notifications | `react-hot-toast` | `^2.5.2` | `2.5.2` | Global toaster in `Layout` and feature-level success/error feedback. |
| Carousels | `swiper` | `^12.1.4` | `12.1.4` | Book and profile carousels with A11y, autoplay, keyboard, and pagination modules. |
| Build tool | `vite` | `8.0.10` | `8.0.10` | Development server, production build, and preview server. |
| React build plugin | `@vitejs/plugin-react` | `6.0.1` | `6.0.1` | Vite React transform plugin. |
| Language | `typescript` | `6.0.3` | `6.0.3` | Strict static typing configured by `tsconfig.json`. |
| Type linting | `typescript-eslint` | `^8.59.2` | `8.59.2` | TypeScript-aware ESLint flat-config presets. |
| Linting | `eslint` | `^9.17.0` | `9.39.4` | Project lint runner invoked by `npm run lint`. |
| Linting | `@eslint/js` | `^9.17.0` | `9.39.4` | Base JavaScript recommended rules in `eslint.config.js`. |
| Linting | `eslint-plugin-react` | `^7.37.2` | `7.37.4` | React and JSX runtime lint rules. |
| Linting | `eslint-plugin-react-hooks` | `^5.0.0` | `5.1.0` | React hooks rules. |
| Linting | `eslint-plugin-react-refresh` | `^0.4.16` | `0.4.18` | Fast Refresh export-safety rule. |
| Linting | `globals` | `^15.14.0` | `15.14.0` | Browser global definitions for ESLint. |
| Testing | `vitest` | `4.1.5` | `4.1.5` | Test runner used by `npm test`. |
| Testing | `@testing-library/react` | `16.3.2` | `16.3.2` | Component and hook rendering utilities in tests. |
| Testing | `jsdom` | `29.1.1` | `29.1.1` | DOM environment for Vitest. |
| Types | `@types/react` | `19.2.14` | `19.2.14` | React TypeScript declarations. |
| Types | `@types/react-dom` | `19.2.3` | `19.2.3` | React DOM TypeScript declarations. |

No component library, Redux/Zustand store, Prettier package, lint-staged setup, Playwright setup, or Cypress setup is present in `client/package.json`.

## Architecture Overview

### Source Tree

The current `src/` directory tree is:

```text
src/
|-- app/
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
|       |-- InlineSpinner/
|       |-- LoadMorePagination/
|       |-- StarRating/
|       `-- ToggleSwitch/
|-- config/
|-- features/
|   |-- auth/
|   |   |-- components/
|   |   |   |-- AuthFields/
|   |   |   |-- AuthShell/
|   |   |   |-- RegisterPageSections/
|   |   |   `-- ResetPasswordForms/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- store/
|   |   `-- types/
|   |-- catalog/
|   |   |-- components/
|   |   |   |-- BookPageSections/
|   |   |   |-- ExploreSections/
|   |   |   |-- FilterSidebar/
|   |   |   `-- SearchSections/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|   |   `-- utils/
|   |-- collections/
|   |   |-- components/
|   |   |   `-- CollectionsPageSections/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|   |   `-- utils/
|   |-- errors/
|   |   `-- pages/
|   |-- follows/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- types/
|   |-- home/
|   |   `-- pages/
|   |-- notifications/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- types/
|   |-- profile/
|   |   |-- components/
|   |   |   `-- ProfileSections/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|   |   `-- utils/
|   `-- settings/
|       |-- components/
|       |   `-- SettingsSections/
|       |-- constants/
|       |-- hooks/
|       |-- pages/
|       |-- types/
|       `-- utils/
|-- hooks/
|-- lib/
|-- routes/
|-- styles/
|-- test/
|-- types/
|-- utils/
|-- main.tsx
`-- vite-env.d.ts
```

### Top-Level Directories

| Path | Role and conventions |
| --- | --- |
| `src/main.tsx` | Application entry. Imports global CSS, font CSS, Swiper CSS, initializes the persisted/system theme, and mounts `<AppProviders><App /></AppProviders>` into `#root`. |
| `src/vite-env.d.ts` | Vite environment typing for `VITE_API_BASE_URL` and module declarations for Swiper CSS imports. |
| `src/app/` | App composition only. `App.tsx` returns the router, and `providers.tsx` composes `AuthProvider` and `QueryClientProvider`. |
| `src/config/` | Runtime configuration wrappers. Currently contains `env.ts`, which normalizes `VITE_API_BASE_URL` and removes a trailing slash. |
| `src/routes/` | Route table, route constants/builders, and auth/admin guards. Routes are centralized in `AppRouter.tsx`; path strings and typed route builders live in `paths.ts`. |
| `src/components/layout/` | Cross-page shell components. Contains `Layout`, `Navbar`, `Footer`, and `ErrorBoundary`, each in its own PascalCase directory with an `index.ts` barrel. |
| `src/components/ui/` | Reusable generic UI primitives. Each primitive is in a PascalCase directory with a same-name `.tsx` file and `index.ts` export. |
| `src/features/` | Feature-first domain modules. Feature code is grouped by domain, then by `components`, `hooks`, `pages`, `services`, `types`, and optional `utils`, `constants`, or `store`. |
| `src/hooks/` | Shared cross-feature hooks: page search params, scroll state, global search shortcut, and theme mode. |
| `src/lib/` | Shared infrastructure: Axios client, image URL resolution, response normalizers, pagination helpers, React Query client, and theme persistence. |
| `src/styles/` | Global styling. `index.css` contains Tailwind v4 CSS-first theme tokens, custom utilities, base styles, animations, and light/dark variables. |
| `src/test/` | Shared test helpers and cross-page smoke coverage. `renderHookWithClient.tsx` creates a React Query wrapper; `QueryBackedPages.test.tsx` renders data-backed pages with mocked hooks. |
| `src/types/` | Shared API envelope and pagination types. Feature-specific types stay inside each feature's `types/` directory. |
| `src/utils/` | Small cross-feature pure utilities. Currently contains `colorFromString.ts`. |

### Feature Directories

| Feature | Current responsibility |
| --- | --- |
| `features/auth/` | Login, registration, reset-password UI steps, auth form fields/shells, auth validation schemas, auth mutations, token-backed auth context, and auth API calls. |
| `features/catalog/` | Landing/explore/search/catalog pages, authors, genres/categories, book detail, reviews, ratings, related books, public feed, admin book management, recommendation admin, catalog query keys, and book API services. |
| `features/collections/` | Reading collections, collection detail pages, collection creation/editing UI, collection API services, reading progress, and collection presentation helpers. |
| `features/errors/` | `NotFoundPage` for unmatched routes. |
| `features/follows/` | Follow status/mutations, follower/following profile connection pages, follow API service, and follow types. |
| `features/home/` | Public landing page and its page test. |
| `features/notifications/` | Notification bell menu, notification cards/icons, notification list page, unread counts, notification query keys, and notification API services. |
| `features/profile/` | Current-user and public profile pages, profile sections, profile page data hooks, navbar profile hook, profile actions, user API service, display helpers, and profile types. |
| `features/settings/` | Settings page, profile/account/security/preferences sections, settings tabs, profile/settings data hook, settings validation helpers, and settings types. |

### Routing

`AppRouter.tsx` uses `BrowserRouter`, nested routes under `Layout`, `React.lazy`, and `Suspense` with a shared skeleton fallback. `RequireAuth` protects authenticated pages by checking `user` and `token` from `useAuth`; `RequireAdmin` also requires `authUser.is_staff`.

| Route | Page | Access |
| --- | --- | --- |
| `/` | `features/home/pages/LandingPage.tsx` | Public |
| `/login` | `features/auth/pages/LoginPage.tsx` | Public |
| `/register` | `features/auth/pages/RegisterPage.tsx` | Public |
| `/resetpassword` | `features/auth/pages/ResetPasswordPage.tsx` | Public |
| `/explore` | `features/catalog/pages/ExplorePage.tsx` | Public |
| `/search` | `features/catalog/pages/SearchPage.tsx` | Public |
| `/search/:query` | `features/catalog/pages/SearchPage.tsx` | Public |
| `/authors` | `features/catalog/pages/AuthorsPage.tsx` | Public |
| `/author/:id` | `features/catalog/pages/AuthorPage.tsx` | Public |
| `/genres` | `features/catalog/pages/CategoriesPage.tsx` | Public |
| `/genres/:id/books` | `features/catalog/pages/GenreBooksPage.tsx` | Public |
| `/categories` | `features/catalog/pages/CategoriesPage.tsx` | Public |
| `/profile/:handle` | `features/profile/pages/UserProfilePage.tsx` | Public |
| `/book/:id` | `features/catalog/pages/BookPage.tsx` | Public |
| `/feed` | `features/catalog/pages/FeedPage.tsx` | Authenticated |
| `/profile/me` | `features/profile/pages/ProfilePage.tsx` | Authenticated |
| `/settings` | `features/settings/pages/SettingsPage.tsx` | Authenticated |
| `/collections` | `features/collections/pages/CollectionsPage.tsx` | Authenticated |
| `/collections/:id` | `features/collections/pages/CollectionDetailPage.tsx` | Authenticated |
| `/profile/:handle/followers` | `features/follows/pages/ProfileConnectionsPage.tsx` | Authenticated |
| `/profile/:handle/following` | `features/follows/pages/ProfileConnectionsPage.tsx` | Authenticated |
| `/notifications` | `features/notifications/pages/NotificationsPage.tsx` | Authenticated |
| `/admin/books` | `features/catalog/pages/AdminBooksPage.tsx` | Staff admin |
| `/admin/recommendations` | `features/catalog/pages/AdminRecommendationsPage.tsx` | Staff admin |
| `*` | `features/errors/pages/NotFoundPage.tsx` | Public fallback |

### API and State

API access is centralized through `src/lib/axios.ts`. It creates `apiClient` with `API_BASE_URL`, adds bearer auth from `localStorage`, refreshes expired access tokens once on eligible `401` responses, clears local tokens if refresh fails, and handles profile-required `403` envelopes by redirecting to registration. Typed helpers (`getData`, `postData`, `patchData`, `deleteData`) are consumed by feature services.

Feature services are the only places that should know endpoint URLs. Current services are:

- `features/auth/services/authService.ts`
- `features/catalog/services/bookService.ts`
- `features/collections/services/collectionService.ts`
- `features/follows/services/followService.ts`
- `features/notifications/services/notificationService.ts`
- `features/profile/services/userService.ts`

Server state is managed with TanStack Query hooks and query-key factories such as `auth.keys.ts`, `catalog.keys.ts`, `collection.keys.ts`, `notifications.keys.ts`, and `profile.keys.ts`. Client auth state is stored in `features/auth/store/AuthContext.tsx`; there is no Redux/Zustand store.

### UI and Styling

Tailwind CSS is configured through `@import 'tailwindcss'`, `@theme inline`, and `@utility` blocks in `src/styles/index.css`; there is no `tailwind.config.*` file. The app uses CSS custom properties for BookNest theme colors, shadows, font families, light/dark mode, glass surfaces, settings panels, skeleton shimmer, fade-up animation, and shared grid utilities. The active theme is written to `document.documentElement.dataset.theme` by `src/lib/theme.ts` and `src/hooks/useThemeMode.ts`.

Reusable UI primitives currently exported from `src/components/ui/index.ts` are `BookCard`, `BookCardSkeleton`, `EmptyState`, `ErrorState`, `FieldError`, `InlineSpinner`, `LoadMorePagination`, `StarRating`, and `ToggleSwitch`.

Static public assets live in `public/`: `logo.svg`, `highlighted-quote.jpg`, and `user_profile.png`. The favicon, navbar/footer logo, and auth shell use `/logo.svg`; the login page uses `/highlighted-quote.jpg`; profile fallback URLs can use `/user_profile.png`.

## Environment Variables

There is currently no `client/.env.example`. The frontend declares and reads one Vite environment variable:

| Name | Required | Description | Example value |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Optional for local default; required when the API is not `http://localhost:8000` | Base URL used by `src/config/env.ts` for all Axios calls and backend media URL resolution. The value is normalized by removing one trailing slash. If unset, the app uses `http://localhost:8000`. | `https://api.booknest.example.com` |

For local development, put the variable in `client/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Only variables prefixed with `VITE_` are exposed to client code by Vite. Add new variables to `src/vite-env.d.ts` when they are intentionally used from `import.meta.env`.

## Local Development Setup

`client/package.json` does not define an `engines` field, and there is no `.nvmrc`. The current Vite package (`8.0.10`) declares Node.js `^20.19.0 || >=22.12.0`, so use Node.js 20.19.x or 22.12.0 and newer. The lockfile is npm lockfile version 3.

From a clean checkout:

```bash
cd client
node --version
npm ci
printf 'VITE_API_BASE_URL=http://localhost:8000\n' > .env.local
npm run dev
```

The default Vite dev server URL is:

```text
http://localhost:5173/
```

If port `5173` is already in use, Vite will print the next available URL. Use the URL printed by the dev server.

## Available Scripts

| Script | Exact command | What it does | When to use it |
| --- | --- | --- | --- |
| `npm run dev` | `vite` | Starts the Vite development server with HMR. | Daily local frontend development. |
| `npm run build` | `vite build` | Creates a production build in `dist/`. | Before deployment or when validating production bundling. |
| `npm run lint` | `eslint .` | Runs the configured ESLint flat config across the client package. | Before submitting frontend changes. |
| `npm run preview` | `vite preview` | Serves the already-built `dist/` output locally. | After `npm run build` to inspect the production bundle. |
| `npm test` | `vitest run --environment jsdom` | Runs all Vitest tests once in jsdom. | To validate hooks, services, route guards, utilities, and page smoke tests. |

## Build and Deployment

Production build:

```bash
cd client
npm ci
npm run build
```

The output directory is `client/dist/`. Vite also copies files from `client/public/` into the build output.

`VITE_API_BASE_URL` is read at build/dev-server startup. Set it in the deployment environment when the production API is not `http://localhost:8000`:

```bash
VITE_API_BASE_URL=https://api.booknest.example.com npm run build
```

Deployment configuration currently discoverable in the client package is `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

That rewrite supports `BrowserRouter` deep links on Vercel. No client Dockerfile, Netlify config, GitHub Actions workflow, or other client CI/CD file is present in the client package.

## Testing

The frontend uses Vitest with jsdom and React Testing Library. There is no separate Vitest config file; the jsdom environment is supplied directly by the `test` script.

Run all tests:

```bash
npm test
```

Run one test file:

```bash
npx vitest run --environment jsdom src/routes/paths.test.ts
```

Current test files:

```text
src/features/auth/hooks/authHooks.test.tsx
src/features/catalog/hooks/catalogHooks.test.tsx
src/features/catalog/services/bookService.test.ts
src/features/follows/hooks/followHooks.test.tsx
src/features/home/pages/LandingPage.test.tsx
src/features/profile/hooks/profileHooks.test.tsx
src/features/profile/services/userService.test.ts
src/lib/imageUrls.test.ts
src/lib/normalizers.test.ts
src/routes/RequireAuth.test.tsx
src/routes/paths.test.ts
src/test/QueryBackedPages.test.tsx
```

The current tests cover hooks, service normalization, route guards/builders, shared utility functions, the landing page, and query-backed page smoke rendering with mocked feature hooks.

There is no dedicated integration-test script. The page smoke tests in `src/test/QueryBackedPages.test.tsx` run as part of `npm test`. There is no E2E framework or E2E script. There is no coverage command in `package.json`.

## Code Quality

### Linting

ESLint is configured with the flat config in `eslint.config.js`.

```bash
npm run lint
```

The config ignores `dist`, applies `@eslint/js` recommended rules, `typescript-eslint` recommended rules, browser globals, React recommended rules, React JSX runtime rules, React hooks rules, and `react-refresh/only-export-components` as a warning with constant exports allowed.

### Type Checking

There is no `typecheck` script, but TypeScript is configured with `noEmit`, strict mode, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

```bash
npx tsc --noEmit
```

`tsconfig.json` includes only `src`. It enables `allowJs` and `checkJs`, but the current source files under `src/` are TypeScript/TSX.

### Formatting

No Prettier dependency, Prettier config, or formatting script is present. Preserve the existing formatting style and rely on ESLint plus code review for consistency.

### Hooks

No `.husky/`, `lint-staged`, or pre-commit hook configuration is present in the client package or repository root.

## Key Conventions

- Use PascalCase file and directory names for components and pages: `BookCard/BookCard.tsx`, `SettingsPage.tsx`, `NavbarProfileMenu.tsx`.
- Use `use...` names for hooks and keep feature hooks under `src/features/{feature}/hooks/`; shared hooks belong in `src/hooks/`.
- Keep API calls in `src/features/{feature}/services/*Service.ts`; pages should consume data through hooks rather than calling Axios directly.
- Keep shared request helpers, normalizers, pagination helpers, image URL resolution, query client setup, and theme utilities in `src/lib/`.
- Keep feature-specific TypeScript contracts under `src/features/{feature}/types/`; shared envelopes and pagination contracts belong in `src/types/`.
- Keep query-key factories in `*.keys.ts` files near the hooks that use them.
- Keep Yup auth form schemas in `*.schema.ts` files next to auth pages.
- Co-locate tests with the subject when they target a specific feature, route, service, hook, or utility; use `*.test.ts` or `*.test.tsx`.
- Prefer existing barrel exports when they exist. Shared component directories expose `index.ts`; feature root barrels are avoided unless something imports them.
- Route-level page modules are default-exported so `React.lazy(() => import(...))` works in `AppRouter.tsx`.
- Use relative imports. `tsconfig.json` does not define `baseUrl` or `paths`, and the Vite config does not define aliases.
- Use Tailwind utility classes and the custom tokens/utilities in `src/styles/index.css`; there are no CSS modules or styled-components.
- Theme state is persisted under `localStorage` key `booknest.theme`; auth tokens use `token` and `refreshToken`.
- Public static assets are imported with absolute public paths such as `/logo.svg`; backend media-like paths are normalized by `resolveImageUrl`.
- Authenticated routes require both `user` and `token`; staff routes additionally require `authUser.is_staff`.

## Troubleshooting

### Vite Fails Because The Node Version Is Unsupported

The client has no `.nvmrc`, but Vite `8.0.10` requires Node.js `^20.19.0 || >=22.12.0`. Install Node.js 20.19.x or 22.12.0 and newer, then rerun:

```bash
npm ci
npm run dev
```

### API Requests Go To `http://localhost:8000` In The Wrong Environment

`VITE_API_BASE_URL` is unset, so `src/config/env.ts` is using its default. Create or update `client/.env.local` for development, or set the variable in the deployment environment before building:

```dotenv
VITE_API_BASE_URL=https://api.booknest.example.com
```

Restart `npm run dev` after changing Vite environment variables.

### The App Loads But Data-Backed Pages Stay Empty Or Error

The frontend depends on the API for catalog, auth, profile, collection, notification, and admin data. Start the backend at the URL configured by `VITE_API_BASE_URL`, or point `VITE_API_BASE_URL` at a running API. For the default local setup, the API must be available at:

```text
http://localhost:8000
```

### Vite Starts On A Different Port And Browser Requests Are Blocked

If `5173` is busy, Vite may serve the app from `5174` or another port. Use the printed URL and make sure the backend CORS/CSRF settings allow that origin. A typical local backend needs entries like:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Deep Links Return 404 After Deploying Somewhere Other Than Vercel

The app uses `BrowserRouter`, so the static host must rewrite unknown paths to `index.html`. Vercel is covered by `client/vercel.json`; other hosts need equivalent SPA fallback rules.

### `process.env` Is Undefined In Client Code

This is a Vite app. Read client environment variables from `import.meta.env`, prefix exposed variables with `VITE_`, and add TypeScript declarations to `src/vite-env.d.ts`.
