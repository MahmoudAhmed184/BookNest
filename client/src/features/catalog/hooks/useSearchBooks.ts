import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  searchBooks,
  type SearchBooksOrdering,
} from "../services/bookService";
import type { Book } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const searchPageSize = 24;

interface UseSearchBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  isLoadingMore: boolean;
  hasData: boolean;
  refetch: () => void;
}

export function useSearchBooks(
  searchTerm: string,
  page = 1,
  includeExternal = false,
  ordering: SearchBooksOrdering = "relevance"
): UseSearchBooksResult {
  const targetPage = Math.max(1, page);
  const trimmedSearch = searchTerm.trim();
  const query = useInfiniteQuery({
    queryKey: catalogKeys.booksInfinite(
      trimmedSearch,
      searchPageSize,
      includeExternal,
      ordering
    ),
    queryFn: ({ pageParam }) =>
      searchBooks({
        query: trimmedSearch,
        page: pageParam,
        pageSize: searchPageSize,
        includeExternal,
        ordering,
      }),
    enabled: trimmedSearch.length > 0,
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
    staleTime: 60_000,
  });
  const pages = query.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = query;

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

  const pagination = mergeOffsetPages<Book>(pages, {
    page: targetPage,
    pageSize: searchPageSize,
  });

  return {
    books: pagination.results,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    hasData: Boolean(query.data),
    refetch: () => void query.refetch(),
  };
}
