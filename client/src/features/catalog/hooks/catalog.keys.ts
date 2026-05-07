export const catalogKeys = {
  books: (query: string, page: number, pageSize: number) =>
    ["books", "search", query, page, pageSize] as const,
  suggestions: (query: string, limit: number) =>
    ["books", "suggestions", query, limit] as const,
  catalogBooks: (page: number, pageSize: number) =>
    ["books", "catalog", page, pageSize] as const,
  popularBooks: (limit: number) => ["books", "popular", limit] as const,
  genres: (limit: number) => ["genres", limit] as const,
  genresPage: (page: number, pageSize: number) =>
    ["genres", "page", page, pageSize] as const,
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
