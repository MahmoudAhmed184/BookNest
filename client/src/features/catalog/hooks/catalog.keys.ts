export const catalogKeys = {
  books: (query: string) => ["books", query] as const,
  popularBooks: (limit: number) => ["books", "popular", limit] as const,
  genres: (limit: number) => ["genres", limit] as const,
  recommendations: () => ["recommendations"] as const,
  book: (id: string | undefined) => ["book", id] as const,
  relatedBooks: (id: string | undefined) => ["book", id, "related"] as const,
  author: (id: string | undefined) => ["author", id] as const,
  authorBooks: (id: string | undefined) => ["author", id, "books"] as const,
  reviews: (id: string | undefined) => ["reviews", id] as const,
  ratings: (id: string | undefined) => ["ratings", id] as const,
  myRating: (id: string | undefined) => ["ratings", id, "me"] as const,
  feedActivities: (pageSize: number) => ["feed-activities", pageSize] as const,
};
