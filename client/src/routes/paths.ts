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
  collections: "/collections",
  collection: "/collections/:id",
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
export type CollectionRoute = `/collections/${string}`;

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

export interface CollectionRouteParams {
  [key: string]: string | undefined;
  id: string;
}

type RouteParam = string | number;

function routeParam(value: RouteParam): string {
  return encodeURIComponent(String(value));
}

export const routeBuilders = {
  searchQuery: (query: string): SearchRoute =>
    `/search/${encodeURIComponent(query)}`,
  book: (id: RouteParam): BookRoute => `/book/${routeParam(id)}`,
  author: (id: RouteParam): AuthorRoute => `/author/${routeParam(id)}`,
  userProfile: (id: RouteParam): UserProfileRoute => `/profile/${routeParam(id)}`,
  collection: (id: RouteParam): CollectionRoute => `/collections/${routeParam(id)}`,
} as const;
