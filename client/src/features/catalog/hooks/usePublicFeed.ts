import { useQuery } from "@tanstack/react-query";

import { getFeedEvents } from "../services/bookService";
import type { FeedEvent } from "../types/book";
import { catalogKeys } from "./catalog.keys";

const feedPageSize = 20;

interface UsePublicFeedResult {
  activities: FeedEvent[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export function usePublicFeed(): UsePublicFeedResult {
  const query = useQuery({
    queryKey: catalogKeys.feedEvents(feedPageSize),
    queryFn: () => getFeedEvents(),
  });

  return {
    activities: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => undefined,
    refetch: () => void query.refetch(),
  };
}
