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
  genres: "/genres",
  genreBooks: "/genres/:id/books",
  myProfile: "/profile/me",
  userProfile: "/profile/:handle",
  profileFollowers: "/profile/:handle/followers",
  profileFollowing: "/profile/:handle/following",
  categories: "/categories",
  collections: "/collections",
  collection: "/collections/:id",
  feed: "/feed",
  settings: "/settings",
  book: "/book/:id",
  notifications: "/notifications",
  adminBooks: "/admin/books",
  adminRecommendations: "/admin/recommendations",
  notFound: "*",
} as const;

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
  handle: string;
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

export function isNumericRouteParam(value: RouteParam | undefined): boolean {
  return value !== undefined && /^\d+$/.test(String(value));
}

export const routeBuilders = {
  searchQuery: (query: string): SearchRoute =>
    `/search/${encodeURIComponent(query)}`,
  book: (id: RouteParam): BookRoute => `/book/${routeParam(id)}`,
  author: (id: RouteParam): AuthorRoute => `/author/${routeParam(id)}`,
  genreBooks: (id: RouteParam): GenreBooksRoute =>
    `/genres/${routeParam(id)}/books`,
  userProfile: (handle: RouteParam): UserProfileRoute =>
    `/profile/${routeParam(handle)}`,
  profileFollowers: (handle: RouteParam): ProfileFollowersRoute =>
    `/profile/${routeParam(handle)}/followers`,
  profileFollowing: (handle: RouteParam): ProfileFollowingRoute =>
    `/profile/${routeParam(handle)}/following`,
  collection: (id: RouteParam): CollectionRoute => `/collections/${routeParam(id)}`,
} as const;
