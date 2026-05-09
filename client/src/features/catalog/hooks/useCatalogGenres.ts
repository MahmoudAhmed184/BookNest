import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getGenresPage } from "../services/bookService";
import type { CatalogGenre } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const categoriesPageSize = 48;

interface UseCatalogGenresResult {
  genres: CatalogGenre[];
  pagination: OffsetPaginatedResponse<CatalogGenre>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  refetch: () => void;
}

export function useCatalogGenres(
  page = 1,
  query = ""
): UseCatalogGenresResult {
  const targetPage = Math.max(1, page);
  const trimmedQuery = query.trim();
  const genresQuery = useInfiniteQuery({
    queryKey: catalogKeys.genresPageInfinite(categoriesPageSize, trimmedQuery),
    queryFn: ({ pageParam }) =>
      getGenresPage({
        page: pageParam,
        pageSize: categoriesPageSize,
        query: trimmedQuery,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
    staleTime: 60_000,
  });
  const pages = genresQuery.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = genresQuery;

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

  const pagination = mergeOffsetPages<CatalogGenre>(pages, {
    page: targetPage,
    pageSize: categoriesPageSize,
  });

  return {
    genres: pagination.results,
    pagination,
    isLoading: genresQuery.isLoading,
    isFetching: genresQuery.isFetching,
    isError: genresQuery.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    refetch: () => void genresQuery.refetch(),
  };
}
