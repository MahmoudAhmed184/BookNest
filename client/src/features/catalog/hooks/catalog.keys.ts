export const catalogKeys = {
  books: (query: string) => ["books", query] as const,
  recommendations: () => ["recommendations"] as const,
  book: (id: string | undefined) => ["book", id] as const,
  reviews: (id: string | undefined) => ["reviews", id] as const,
  ratings: (id: string | undefined) => ["ratings", id] as const,
};
