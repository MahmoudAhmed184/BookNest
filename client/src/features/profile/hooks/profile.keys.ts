export const profileKeys = {
  me: () => ["user"] as const,
  profile: (id: string | undefined) => ["user", id] as const,
  reviews: () => ["reviews"] as const,
  userReviews: (id: string | undefined) => ["reviews", id] as const,
  ratings: () => ["ratings"] as const,
  userRatings: (id: string | undefined) => ["ratings", id] as const,
  collections: () => ["collections"] as const,
  userCollections: (id: string | undefined) => ["collections", id] as const,
  notifications: () => ["notifications"] as const,
};
