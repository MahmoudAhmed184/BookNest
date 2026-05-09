import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getAuthors } from "../services/bookService";
import type { Author } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const authorsPageSize = 24;

interface UseAuthorsResult {
  authors: Author[];
  pagination: OffsetPaginatedResponse<Author>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  refetch: () => void;
}

export function useAuthors(query: string, page = 1): UseAuthorsResult {
  const targetPage = Math.max(1, page);
  const trimmedQuery = query.trim();
  const authorsQuery = useInfiniteQuery({
    queryKey: catalogKeys.authorsInfinite(authorsPageSize, trimmedQuery),
    queryFn: ({ pageParam }) =>
      getAuthors({
        page: pageParam,
        pageSize: authorsPageSize,
        name__icontains: trimmedQuery || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
    staleTime: 60_000,
  });
  const pages = authorsQuery.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = authorsQuery;

  useEffect(() => {
    if (
      !shouldLoadNextOffsetPage({
        targetPage,
        loadedPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
      })
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    loadedPage,
    targetPage,
  ]);

  const pagination = mergeOffsetPages<Author>(pages, {
    page: targetPage,
    pageSize: authorsPageSize,
  });

  return {
    authors: pagination.results,
    pagination,
    isLoading: authorsQuery.isLoading,
    isFetching: authorsQuery.isFetching,
    isError: authorsQuery.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    refetch: () => void authorsQuery.refetch(),
  };
}
