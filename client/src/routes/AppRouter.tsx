import { lazy, Suspense, type ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "../components/layout";
import { BookCardSkeleton } from "../components/ui";
import { routePaths } from "./paths";

const Login = lazy(() => import("../features/auth/pages/LoginPage"));
const Register = lazy(() => import("../features/auth/pages/RegisterPage"));
const ResetPassword = lazy(() => import("../features/auth/pages/ResetPasswordPage"));
const Explore = lazy(() => import("../features/catalog/pages/ExplorePage"));
const Search = lazy(() => import("../features/catalog/pages/SearchPage"));
const Author = lazy(() => import("../features/catalog/pages/AuthorPage"));
const Profile = lazy(() => import("../features/profile/pages/ProfilePage"));
const Categories = lazy(() => import("../features/catalog/pages/CategoriesPage"));
const Feed = lazy(() => import("../features/catalog/pages/FeedPage"));
const Settings = lazy(() => import("../features/settings/pages/SettingsPage"));
const Book = lazy(() => import("../features/catalog/pages/BookPage"));
const Landing = lazy(() => import("../features/home/pages/LandingPage"));
const Notifications = lazy(() => import("../features/notifications/pages/NotificationsPage"));
const NotFound = lazy(() => import("../features/errors/pages/NotFoundPage"));
const UserProfile = lazy(() => import("../features/profile/pages/UserProfilePage"));
const fallbackSkeletonKeys = ["route-skeleton-1", "route-skeleton-2", "route-skeleton-3", "route-skeleton-4"];

const routeFallback = (
  <div className="grow py-12 animate-fade-up" role="status" aria-live="polite">
    <div className="mb-8 flex flex-col gap-3">
      <div className="h-8 w-56 rounded-full animate-shimmer" />
      <div className="h-4 w-full max-w-md rounded-full animate-shimmer" />
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {fallbackSkeletonKeys.map((key) => (
        <BookCardSkeleton key={key} />
      ))}
    </div>
  </div>
);

function withSuspense(element: ReactElement): ReactElement {
  return <Suspense fallback={routeFallback}>{element}</Suspense>;
}

export function AppRouter(): ReactElement {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={withSuspense(<Landing />)} />
          {/* Default route */}
          <Route path={routePaths.login} element={withSuspense(<Login />)} />
          <Route path={routePaths.register} element={withSuspense(<Register />)} />
          <Route
            path={routePaths.resetPassword}
            element={withSuspense(<ResetPassword />)}
          />
          <Route path={routePaths.explore} element={withSuspense(<Explore />)} />
          <Route path={routePaths.search} element={withSuspense(<Search />)} />
          <Route path={routePaths.searchQuery} element={withSuspense(<Search />)} />
          <Route path={routePaths.author} element={withSuspense(<Author />)} />
          <Route path={routePaths.myProfile} element={withSuspense(<Profile />)} />
          <Route
            path={routePaths.userProfile}
            element={withSuspense(<UserProfile />)}
          />
          <Route
            path={routePaths.categories}
            element={withSuspense(<Categories />)}
          />
          <Route path={routePaths.feed} element={withSuspense(<Feed />)} />
          <Route path={routePaths.settings} element={withSuspense(<Settings />)} />
          <Route path={routePaths.book} element={withSuspense(<Book />)} />
          <Route
            path={routePaths.notifications}
            element={withSuspense(<Notifications />)}
          />
          <Route path={routePaths.notFound} element={withSuspense(<NotFound />)} />
          {/* Catch-all route for 404 */}
        </Route>
      </Routes>
    </Router>
  );
}
