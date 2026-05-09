import { useQuery } from "@tanstack/react-query";

import { getUserDataAggregate } from "../services/userService";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingCollection } from "../../collections/types/collection";
import type {
  ProfileOverviewStats,
  ProfileViewerContext,
  UserProfile,
} from "../types/user";
import { profileKeys } from "./profile.keys";

interface UseUserProfilePageDataResult {
  user?: UserProfile | undefined;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  collections?: ReadingCollection[] | undefined;
  stats?: ProfileOverviewStats | undefined;
  viewerContext?: ProfileViewerContext | undefined;
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

interface UseUserProfilePageDataOptions {
  enabled?: boolean;
}

export function useUserProfilePageData(
  profileParam: string | undefined,
  token?: string | null,
  options: UseUserProfilePageDataOptions = {}
): UseUserProfilePageDataResult {
  const userQuery = useQuery({
    queryKey: profileKeys.overview(profileParam),
    queryFn: () => getUserDataAggregate(profileParam, token),
    enabled: Boolean(profileParam && (options.enabled ?? true)),
  });
  const aggregate = userQuery.data;

  return {
    user: aggregate?.profile,
    reviews: aggregate?.reviews,
    ratings: aggregate?.ratings,
    collections: aggregate?.reading_collections,
    stats: aggregate?.stats,
    viewerContext: aggregate?.viewer_context,
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
