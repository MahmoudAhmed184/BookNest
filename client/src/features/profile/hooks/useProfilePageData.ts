import { useQuery } from "@tanstack/react-query";

import { getCollections } from "../../collections/services/collectionService";
import {
  getMyProfile,
  getUserRatings,
  getUserReviews,
} from "../services/userService";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingList } from "../../collections/types/collection";
import type { UserProfile } from "../types/user";
import { profileKeys } from "./profile.keys";

interface UseProfilePageDataResult {
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

export function useProfilePageData(token?: string | null): UseProfilePageDataResult {
  const userQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getMyProfile(token),
  });
  const reviewsQuery = useQuery({
    queryKey: profileKeys.reviews(),
    queryFn: () => getUserReviews(userQuery.data?.user_id, token),
    enabled: !!userQuery.data?.user_id,
  });
  const ratingsQuery = useQuery({
    queryKey: profileKeys.ratings(),
    queryFn: () => getUserRatings(userQuery.data?.user_id, token),
    enabled: !!userQuery.data?.user_id,
  });
  const collectionsQuery = useQuery({
    queryKey: profileKeys.collections(),
    queryFn: () => getCollections(token),
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
