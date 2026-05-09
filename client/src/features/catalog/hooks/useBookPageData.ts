import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getBook,
  getBookRatings,
  getRatingForBook,
  getReviews,
  listReviewVotes,
} from "../services/bookService";
import { getCollections } from "../../collections/services/collectionService";
import type { ReadingCollection } from "../../collections/types/collection";
import type {
  Book,
  BookRating,
  BookReview,
  ReviewSortParams,
  ReviewVote,
} from "../types/book";
import { catalogKeys } from "./catalog.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

function sortBookReviews(
  reviews: BookReview[],
  sort: ReviewSortParams
): BookReview[] {
  const direction = sort.order === "asc" ? 1 : -1;

  return [...reviews].sort((a, b) => {
    if (sort.sortBy === "upvote_count") {
      return ((a.upvote_count ?? 0) - (b.upvote_count ?? 0)) * direction;
    }

    return (
      new Date(a.reviewed_at ?? a.created_at ?? 0).getTime() -
      new Date(b.reviewed_at ?? b.created_at ?? 0).getTime()
    ) * direction;
  });
}

interface UseBookPageDataResult {
  collections?: ReadingCollection[] | undefined;
  book?: Book | undefined;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  reviewVotes?: ReviewVote[] | undefined;
  userRating?: BookRating | null | undefined;
  isBookLoading: boolean;
  isBookFetching: boolean;
  isBookError: boolean;
  isReviewsLoading: boolean;
  isReviewsFetching: boolean;
  isReviewsError: boolean;
  isRatingsError: boolean;
  isReviewVotesError: boolean;
  refetchBook: () => void;
  refetchReviews: () => void;
  refetchRatings: () => void;
}

export function useBookPageData(
  id: string | undefined,
  token?: string | null,
  reviewSort: ReviewSortParams = { sortBy: "reviewed_at", order: "desc" }
): UseBookPageDataResult {
  const collectionsQuery = useQuery({
    queryKey: profileKeys.collections(),
    queryFn: () => getCollections(token),
    enabled: Boolean(token),
  });
  const bookQuery = useQuery({
    queryKey: catalogKeys.book(id),
    queryFn: () => getBook(id),
  });
  const reviewsQuery = useQuery({
    queryKey: catalogKeys.reviewsBase(id),
    queryFn: () => getReviews(id),
  });
  const ratingsQuery = useQuery({
    queryKey: catalogKeys.ratings(id),
    queryFn: () => getBookRatings(id, token),
    refetchInterval: 5000,
  });
  const userRatingQuery = useQuery({
    queryKey: catalogKeys.myRating(id),
    queryFn: () => getRatingForBook(id, token),
    enabled: Boolean(id && token),
    retry: false,
  });
  const reviewVotesQuery = useQuery({
    queryKey: catalogKeys.reviewVotes(),
    queryFn: () => listReviewVotes(token),
    enabled: Boolean(token),
  });

  const sortedReviews = useMemo(
    () =>
      reviewsQuery.data
        ? sortBookReviews(reviewsQuery.data, reviewSort)
        : undefined,
    [reviewsQuery.data, reviewSort]
  );

  return {
    collections: collectionsQuery.data,
    book: bookQuery.data,
    reviews: sortedReviews,
    ratings: ratingsQuery.data,
    reviewVotes: reviewVotesQuery.data,
    userRating: userRatingQuery.data,
    isBookLoading: bookQuery.isLoading,
    isBookFetching: bookQuery.isFetching,
    isBookError: bookQuery.isError,
    isReviewsLoading: reviewsQuery.isLoading,
    isReviewsFetching: reviewsQuery.isFetching,
    isReviewsError: reviewsQuery.isError,
    isRatingsError: ratingsQuery.isError,
    isReviewVotesError: reviewVotesQuery.isError,
    refetchBook: () => void bookQuery.refetch(),
    refetchReviews: () => void reviewsQuery.refetch(),
    refetchRatings: () => void ratingsQuery.refetch(),
  };
}
