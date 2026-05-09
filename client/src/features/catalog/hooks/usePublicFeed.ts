import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getFeedEvents } from "../services/bookService";
import type { FeedEvent } from "../types/book";
import { catalogKeys } from "./catalog.keys";

const feedPageSize = 20;

interface UsePublicFeedResult {
  activities: FeedEvent[];
  loadedCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export function usePublicFeed(): UsePublicFeedResult {
  const query = useInfiniteQuery({
    queryKey: catalogKeys.feedEvents(feedPageSize),
    queryFn: ({ pageParam }) => getFeedEvents(pageParam, feedPageSize),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
  });
  const activities =
    query.data?.pages.flatMap((page) => page.results) ?? [];
  const { fetchNextPage: fetchNextFeedPage, refetch: refetchFeed } = query;
  const fetchNextPage = useCallback((): void => {
    void fetchNextFeedPage();
  }, [fetchNextFeedPage]);
  const refetch = useCallback((): void => {
    void refetchFeed();
  }, [refetchFeed]);

  return {
    activities,
    loadedCount: activities.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage,
    refetch,
  };
}
