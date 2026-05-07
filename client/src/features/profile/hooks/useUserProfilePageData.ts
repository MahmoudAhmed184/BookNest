import { useQuery } from "@tanstack/react-query";

import { getUserDataAggregate } from "../services/userService";
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
  id: string | undefined,
  token?: string | null
): UseUserProfilePageDataResult {
  const userQuery = useQuery({
    queryKey: profileKeys.profile(id),
    queryFn: () => getUserDataAggregate(id, token),
    enabled: !!id,
  });
  const aggregate = userQuery.data;

  return {
    user: aggregate?.profile,
    reviews: aggregate?.reviews,
    ratings: aggregate?.ratings,
    collections: aggregate?.reading_lists,
    isUserLoading: userQuery.isLoading,
    isUserFetching: userQuery.isFetching,
    isUserError: userQuery.isError,
    isReviewsLoading: userQuery.isLoading,
    isReviewsFetching: userQuery.isFetching,
    isReviewsError: userQuery.isError,
    isRatingsError: userQuery.isError,
    isCollectionsLoading: userQuery.isLoading,
    isCollectionsFetching: userQuery.isFetching,
    isCollectionsError: userQuery.isError,
    refetchUser: () => void userQuery.refetch(),
    refetchReviews: () => void userQuery.refetch(),
    refetchRatings: () => void userQuery.refetch(),
    refetchCollections: () => void userQuery.refetch(),
  };
}
