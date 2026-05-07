import { useInfiniteQuery } from "@tanstack/react-query";

import { getFeedActivities } from "../services/bookService";
import type { FeedActivity } from "../types/book";
import { catalogKeys } from "./catalog.keys";

const feedPageSize = 20;

function getCursorFromNextUrl(next: string | null): string | undefined {
  if (!next) return undefined;

  try {
    const baseUrl =
      typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(next, baseUrl);
    return url.searchParams.get("cursor") ?? undefined;
  } catch {
    return undefined;
  }
}

interface UsePublicFeedResult {
  activities: FeedActivity[];
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
    queryKey: catalogKeys.feedActivities(feedPageSize),
    queryFn: ({ pageParam }) => {
      if (pageParam) {
        return getFeedActivities({ pageSize: feedPageSize, cursor: pageParam });
      }

      return getFeedActivities({ pageSize: feedPageSize });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => getCursorFromNextUrl(lastPage.next),
  });
  const activities =
    query.data?.pages.flatMap((page) => page.results) ?? [];

  return {
    activities,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}
