import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  type CatalogBookFilters,
  getGenreBooks,
} from "../services/bookService";
import type { Book } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const genreBooksPageSize = 24;

interface UseGenreBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  refetch: () => void;
}

export function useGenreBooks(
  genreId: string | undefined,
  page = 1,
  filters: CatalogBookFilters = {}
): UseGenreBooksResult {
  const targetPage = Math.max(1, page);
  const query = useInfiniteQuery({
    queryKey: catalogKeys.genreBooksInfinite(genreId, genreBooksPageSize, filters),
    queryFn: ({ pageParam }) =>
      getGenreBooks(genreId, { page: pageParam, pageSize: genreBooksPageSize, ...filters }),
    enabled: Boolean(genreId),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
    staleTime: 60_000,
  });
  const pages = query.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = query;

  useEffect(() => {
    if (
      !genreId ||
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
    genreId,
    hasNextPage,
    isError,
    isFetchingNextPage,
    loadedPage,
    targetPage,
  ]);

  const pagination = mergeOffsetPages<Book>(pages, {
    page: targetPage,
    pageSize: genreBooksPageSize,
  });

  return {
    books: pagination.results,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    refetch: () => void query.refetch(),
  };
}
