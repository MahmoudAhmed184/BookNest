export const routePaths = {
  root: "/",
  login: "/login",
  register: "/register",
  resetPassword: "/resetpassword",
  explore: "/explore",
  search: "/search",
  searchQuery: "/search/:query",
  author: "/author/:id",
  myProfile: "/profile/me",
  userProfile: "/profile/:id",
  categories: "/categories",
  feed: "/feed",
  settings: "/settings",
  book: "/book/:id",
  notifications: "/notifications",
  notFound: "*",
} as const;

export type AppRoutePath = (typeof routePaths)[keyof typeof routePaths];
export type SearchRoute = `/search/${string}`;
export type BookRoute = `/book/${string}`;
export type AuthorRoute = `/author/${string}`;
export type UserProfileRoute = `/profile/${string}`;

export interface BookRouteParams {
  [key: string]: string | undefined;
  id: string;
}

export interface SearchRouteParams {
  [key: string]: string | undefined;
  query: string;
}

export interface UserProfileRouteParams {
  [key: string]: string | undefined;
  id: string;
}

export const routeBuilders = {
  searchQuery: (query: string): SearchRoute =>
    `/search/${encodeURIComponent(query)}`,
  book: (id: string | number | undefined): BookRoute => `/book/${String(id)}`,
  author: (id: string | number | undefined): AuthorRoute => `/author/${String(id)}`,
  userProfile: (id: string | number | null | undefined): UserProfileRoute =>
    `/profile/${String(id)}`,
} as const;
