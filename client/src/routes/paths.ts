export const routePaths = {
  root: "/",
  login: "/login",
  register: "/register",
  resetPassword: "/resetpassword",
  explore: "/explore",
  search: "/search",
  searchQuery: "/search/:query",
  authors: "/authors",
  author: "/author/:id",
  genreBooks: "/genres/:id/books",
  myProfile: "/profile/me",
  userProfile: "/profile/:id",
  profileFollowers: "/profile/:id/followers",
  profileFollowing: "/profile/:id/following",
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
export type GenreBooksRoute = `/genres/${string}/books`;
export type UserProfileRoute = `/profile/${string}`;
export type ProfileFollowersRoute = `/profile/${string}/followers`;
export type ProfileFollowingRoute = `/profile/${string}/following`;
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

export interface GenreBooksRouteParams {
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
  genreBooks: (id: RouteParam): GenreBooksRoute =>
    `/genres/${routeParam(id)}/books`,
  userProfile: (id: RouteParam): UserProfileRoute => `/profile/${routeParam(id)}`,
  profileFollowers: (id: RouteParam): ProfileFollowersRoute =>
    `/profile/${routeParam(id)}/followers`,
  profileFollowing: (id: RouteParam): ProfileFollowingRoute =>
    `/profile/${routeParam(id)}/following`,
  collection: (id: RouteParam): CollectionRoute => `/collections/${routeParam(id)}`,
} as const;
