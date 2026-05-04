import { lazy, Suspense, type ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import BookCardSkeleton from "./components/BookCardSkeleton";

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

type AppRoutePath =
  | "/login"
  | "/register"
  | "/resetpassword"
  | "/explore"
  | "/search"
  | "/search/:query"
  | "/author"
  | "/profile/me"
  | "/profile/:id"
  | "/categories"
  | "/feed"
  | "/settings"
  | "/book/:id"
  | "/notifications"
  | "*";

const routes = {
  login: "/login",
  register: "/register",
  resetPassword: "/resetpassword",
  explore: "/explore",
  search: "/search",
  searchQuery: "/search/:query",
  author: "/author",
  myProfile: "/profile/me",
  userProfile: "/profile/:id",
  categories: "/categories",
  feed: "/feed",
  settings: "/settings",
  book: "/book/:id",
  notifications: "/notifications",
  notFound: "*",
} as const satisfies Record<string, AppRoutePath>;

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

function AppRouter(): ReactElement {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={withSuspense(<Landing />)} />
          {/* Default route */}
          <Route path={routes.login} element={withSuspense(<Login />)} />
          <Route path={routes.register} element={withSuspense(<Register />)} />
          <Route
            path={routes.resetPassword}
            element={withSuspense(<ResetPassword />)}
          />
          <Route path={routes.explore} element={withSuspense(<Explore />)} />
          <Route path={routes.search} element={withSuspense(<Search />)} />
          <Route path={routes.searchQuery} element={withSuspense(<Search />)} />
          <Route path={routes.author} element={withSuspense(<Author />)} />
          <Route path={routes.myProfile} element={withSuspense(<Profile />)} />
          <Route
            path={routes.userProfile}
            element={withSuspense(<UserProfile />)}
          />
          <Route
            path={routes.categories}
            element={withSuspense(<Categories />)}
          />
          <Route path={routes.feed} element={withSuspense(<Feed />)} />
          <Route path={routes.settings} element={withSuspense(<Settings />)} />
          <Route path={routes.book} element={withSuspense(<Book />)} />
          <Route
            path={routes.notifications}
            element={withSuspense(<Notifications />)}
          />
          <Route path={routes.notFound} element={withSuspense(<NotFound />)} />
          {/* Catch-all route for 404 */}
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRouter;
