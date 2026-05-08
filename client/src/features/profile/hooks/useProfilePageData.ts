import { useQuery } from "@tanstack/react-query";

import {
  getMyProfile,
  getUserDataAggregate,
} from "../services/userService";
import type { BookRating, BookReview } from "../../catalog/types/book";
import type { ReadingCollection } from "../../collections/types/collection";
import type {
  ProfileOverviewStats,
  ProfileViewerContext,
  UserProfile,
} from "../types/user";
import { profileKeys } from "./profile.keys";

interface UseProfilePageDataResult {
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

export function useProfilePageData(token?: string | null): UseProfilePageDataResult {
  const userQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getMyProfile(token),
  });
  const overviewQuery = useQuery({
    queryKey: profileKeys.overview(userQuery.data?.user.id),
    queryFn: () => getUserDataAggregate(userQuery.data?.user.id, token),
    enabled: !!userQuery.data?.user.id,
  });
  const aggregate = overviewQuery.data;

  return {
    user: aggregate?.profile ?? userQuery.data,
    reviews: aggregate?.reviews,
    ratings: aggregate?.ratings,
    collections: aggregate?.reading_collections,
    stats: aggregate?.stats,
    viewerContext: aggregate?.viewer_context,
    isUserLoading: userQuery.isLoading,
    isUserFetching: userQuery.isFetching || overviewQuery.isFetching,
    isUserError: userQuery.isError,
    isReviewsLoading: overviewQuery.isLoading,
    isReviewsFetching: overviewQuery.isFetching,
    isReviewsError: overviewQuery.isError,
    isRatingsError: overviewQuery.isError,
    isCollectionsLoading: overviewQuery.isLoading,
    isCollectionsFetching: overviewQuery.isFetching,
    isCollectionsError: overviewQuery.isError,
    refetchUser: () => void userQuery.refetch(),
    refetchReviews: () => void overviewQuery.refetch(),
    refetchRatings: () => void overviewQuery.refetch(),
    refetchCollections: () => void overviewQuery.refetch(),
  };
}
