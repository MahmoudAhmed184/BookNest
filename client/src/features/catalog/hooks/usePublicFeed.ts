import { useQuery } from "@tanstack/react-query";

import { getFeedActivities } from "../services/bookService";
import type { FeedActivity } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UsePublicFeedResult {
  activities: FeedActivity[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function usePublicFeed(): UsePublicFeedResult {
  const query = useQuery({
    queryKey: catalogKeys.feedActivities(),
    queryFn: () => getFeedActivities(),
  });

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
