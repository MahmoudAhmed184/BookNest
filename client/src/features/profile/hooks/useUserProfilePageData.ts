import { useQuery } from "@tanstack/react-query";

import { getUserCollections } from "../../collections/services/collectionService";
import {
  getProfile,
  getUserRatings,
  getUserReviews,
} from "../services/userService";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingList } from "../../collections/types/collection";
import type { UserProfile } from "../types/user";
import { profileKeys } from "./profile.keys";

interface UseUserProfilePageDataResult {
  user?: UserProfile | undefined;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  collections?: ReadingList[] | undefined;
  isUserLoading: boolean;
  isUserFetching: boolean;
  isUserError: boolean;
  isReviewsLoading: boolean;
  isReviewsFetching: boolean;
  isReviewsError: boolean;
  isRatingsError: boolean;
  isCollectionsLoading: boolean;
  isCollectionsFetching: boolean;
  isCollectionsError: boolean;
  refetchUser: () => void;
  refetchReviews: () => void;
  refetchRatings: () => void;
  refetchCollections: () => void;
}

export function useUserProfilePageData(
  id: string | undefined
): UseUserProfilePageDataResult {
  const userQuery = useQuery({
    queryKey: profileKeys.profile(id),
    queryFn: () => getProfile(id),
    enabled: !!id,
  });
  const userId = userQuery.data?.user_id;
  const reviewsQuery = useQuery({
    queryKey: profileKeys.userReviews(id),
    queryFn: () => getUserReviews(userId),
    enabled: !!userId,
  });
  const ratingsQuery = useQuery({
    queryKey: profileKeys.userRatings(id),
    queryFn: () => getUserRatings(userId),
    enabled: !!userId,
  });
  const collectionsQuery = useQuery({
    queryKey: profileKeys.userCollections(id),
    queryFn: () => getUserCollections(userId),
    enabled: !!userId,
  });

  return {
    user: userQuery.data,
    reviews: reviewsQuery.data,
    ratings: ratingsQuery.data,
    collections: collectionsQuery.data,
    isUserLoading: userQuery.isLoading,
    isUserFetching: userQuery.isFetching,
    isUserError: userQuery.isError,
    isReviewsLoading: reviewsQuery.isLoading,
    isReviewsFetching: reviewsQuery.isFetching,
    isReviewsError: reviewsQuery.isError,
    isRatingsError: ratingsQuery.isError,
    isCollectionsLoading: collectionsQuery.isLoading,
    isCollectionsFetching: collectionsQuery.isFetching,
    isCollectionsError: collectionsQuery.isError,
    refetchUser: () => void userQuery.refetch(),
    refetchReviews: () => void reviewsQuery.refetch(),
    refetchRatings: () => void ratingsQuery.refetch(),
    refetchCollections: () => void collectionsQuery.refetch(),
  };
}
