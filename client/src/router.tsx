import { lazy, Suspense, type ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { BookCardSkeleton } from "./components/BookCardSkeleton";
import { routePaths } from "./routes";

const Login = lazy(() => import("./pages/Auth/LoginPage"));
const Register = lazy(() => import("./pages/Auth/RegisterPage"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPasswordPage"));
const Explore = lazy(() => import("./pages/Catalog/ExplorePage"));
const Search = lazy(() => import("./pages/Catalog/SearchPage"));
const Author = lazy(() => import("./pages/Catalog/AuthorPage"));
const Profile = lazy(() => import("./pages/Profile/ProfilePage"));
const Categories = lazy(() => import("./pages/Catalog/CategoriesPage"));
const Feed = lazy(() => import("./pages/Catalog/FeedPage"));
const Settings = lazy(() => import("./pages/Profile/SettingsPage"));
const Book = lazy(() => import("./pages/Catalog/BookPage"));
const Landing = lazy(() => import("./pages/Home/LandingPage"));
const Notifications = lazy(() => import("./pages/Profile/NotificationsPage"));
const NotFound = lazy(() => import("./pages/Errors/NotFoundPage"));
const UserProfile = lazy(() => import("./pages/Profile/UserProfilePage"));

const routeFallback = (
  <div className="grow py-12 animate-fade-up" role="status" aria-live="polite">
    <div className="mb-8 flex flex-col gap-3">
      <div className="h-8 w-56 rounded-full animate-shimmer" />
      <div className="h-4 w-full max-w-md rounded-full animate-shimmer" />
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <BookCardSkeleton key={index} />
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
