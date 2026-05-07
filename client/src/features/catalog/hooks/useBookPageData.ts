import { useQuery } from "@tanstack/react-query";

import {
  getBook,
  getBookRatings,
  getReviews,
} from "../services/bookService";
import { getCollections } from "../../collections/services/collectionService";
import type { ReadingList } from "../../collections/types/collection";
import type { Book, BookRating, BookReview } from "../types/book";
import { catalogKeys } from "./catalog.keys";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseBookPageDataResult {
  collections?: ReadingList[] | undefined;
  book?: Book | undefined;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  isBookLoading: boolean;
  isBookFetching: boolean;
  isBookError: boolean;
  isReviewsLoading: boolean;
  isReviewsFetching: boolean;
  isReviewsError: boolean;
  isRatingsError: boolean;
  refetchBook: () => void;
  refetchReviews: () => void;
  refetchRatings: () => void;
}

export function useBookPageData(
  id: string | undefined,
  token?: string | null
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
    queryKey: catalogKeys.reviews(id),
    queryFn: () => getReviews(id),
  });
  const ratingsQuery = useQuery({
    queryKey: catalogKeys.ratings(id),
    queryFn: () => getBookRatings(id, token),
    refetchInterval: 5000,
  });

  return {
    collections: collectionsQuery.data,
    book: bookQuery.data,
    reviews: reviewsQuery.data,
    ratings: ratingsQuery.data,
    isBookLoading: bookQuery.isLoading,
    isBookFetching: bookQuery.isFetching,
    isBookError: bookQuery.isError,
    isReviewsLoading: reviewsQuery.isLoading,
    isReviewsFetching: reviewsQuery.isFetching,
    isReviewsError: reviewsQuery.isError,
    isRatingsError: ratingsQuery.isError,
    refetchBook: () => void bookQuery.refetch(),
    refetchReviews: () => void reviewsQuery.refetch(),
    refetchRatings: () => void ratingsQuery.refetch(),
  };
}
