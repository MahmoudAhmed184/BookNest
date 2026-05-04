import type { ReactElement } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Login from "./pages/Auth/LoginPage";
import Register from "./pages/Auth/RegisterPage";
import ResetPassword from "./pages/Auth/ResetPasswordPage";
import Explore from "./pages/Catalog/ExplorePage";
import Search from "./pages/Catalog/SearchPage";
import Author from "./pages/Catalog/AuthorPage";
import Profile from "./pages/Profile/ProfilePage";
import Categories from "./pages/Catalog/CategoriesPage";
import Feed from "./pages/Catalog/FeedPage";
import Settings from "./pages/Profile/SettingsPage";
import Book from "./pages/Catalog/BookPage";
import Landing from "./pages/Home/LandingPage";
import Notifications from "./pages/Profile/NotificationsPage";
import NotFound from "./pages/Errors/NotFoundPage";
import UserProfile from "./pages/Profile/UserProfilePage";

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

function AppRouter(): ReactElement {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} /> {/* Default route */}
          <Route path={routes.login} element={<Login />} />
          <Route path={routes.register} element={<Register />} />
          <Route path={routes.resetPassword} element={<ResetPassword />} />
          <Route path={routes.explore} element={<Explore />} />
          <Route path={routes.search} element={<Search />} />
          <Route path={routes.searchQuery} element={<Search />} />
          <Route path={routes.author} element={<Author />} />
          <Route path={routes.myProfile} element={<Profile />} />
          <Route path={routes.userProfile} element={<UserProfile />} />
          <Route path={routes.categories} element={<Categories />} />
          <Route path={routes.feed} element={<Feed />} />
          <Route path={routes.settings} element={<Settings />} />
          <Route path={routes.book} element={<Book />} />
          <Route path={routes.notifications} element={<Notifications />} />
          <Route path={routes.notFound} element={<NotFound />} />{" "}
          {/* Catch-all route for 404 */}
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRouter;
