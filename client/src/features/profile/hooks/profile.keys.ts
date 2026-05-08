export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  profile: (id: string | number | undefined) =>
    [...profileKeys.all, id] as const,
  overview: (id: string | number | undefined) =>
    [...profileKeys.profile(id), "overview"] as const,
  reviews: (id: string | number | undefined = "me", page = 1) =>
    [...profileKeys.profile(id), "reviews", page] as const,
  userReviews: (id: string | undefined) => profileKeys.reviews(id),
  ratings: (id: string | number | undefined = "me", page = 1) =>
    [...profileKeys.profile(id), "ratings", page] as const,
  userRatings: (id: string | undefined) => profileKeys.ratings(id),
  collections: (id: string | number | undefined = "me", page = 1) =>
    [...profileKeys.profile(id), "collections", page] as const,
  userCollections: (id: string | undefined) => profileKeys.collections(id),
  preferences: () => ["preferences", "me"] as const,
  notifications: () => ["notifications"] as const,
};
