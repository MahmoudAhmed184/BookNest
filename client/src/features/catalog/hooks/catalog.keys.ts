import type { CatalogBookFilters } from "../services/bookService";

export const catalogKeys = {
  books: (
    query: string,
    page: number,
    pageSize: number,
    includeExternal = false
  ) => ["books", "search", query, page, pageSize, includeExternal] as const,
  suggestions: (query: string, limit: number) =>
    ["books", "suggestions", query, limit] as const,
  catalogBooks: (
    page: number,
    pageSize: number,
    filters: Readonly<CatalogBookFilters> = {}
  ) => ["books", "catalog", page, pageSize, filters] as const,
  popularBooks: (limit: number) => ["books", "popular", limit] as const,
  genres: (limit: number) => ["genres", limit] as const,
  genresPage: (page: number, pageSize: number) =>
    ["genres", "page", page, pageSize] as const,
  genreBooks: (
    genreId: string | number | undefined,
    page: number,
    pageSize: number,
    filters: Readonly<CatalogBookFilters> = {}
  ) => ["genres", genreId, "books", page, pageSize, filters] as const,
  authors: (page: number, pageSize: number, query: string) =>
    ["authors", "page", page, pageSize, query] as const,
  recommendations: () => ["recommendations"] as const,
  book: (id: string | undefined) => ["book", id] as const,
  relatedBooks: (id: string | undefined) => ["book", id, "related"] as const,
  author: (id: string | undefined) => ["author", id] as const,
  authorBooks: (id: string | undefined) => ["author", id, "books"] as const,
  reviewsBase: (id: string | undefined) => ["reviews", id] as const,
  reviews: (
    id: string | undefined,
    sortBy = "created_at",
    order = "desc"
  ) => ["reviews", id, sortBy, order] as const,
  ratings: (id: string | undefined) => ["ratings", id] as const,
  myRating: (id: string | undefined) => ["ratings", id, "me"] as const,
  feedActivities: (pageSize: number) => ["feed-activities", pageSize] as const,
};
