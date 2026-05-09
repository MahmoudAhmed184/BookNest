import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getGenresPage } from "../services/bookService";
import type { CatalogGenre } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const categoriesPageSize = 48;

interface UseCatalogGenresResult {
  genres: CatalogGenre[];
  pagination: OffsetPaginatedResponse<CatalogGenre>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}

function createEmptyPagination(
  page: number,
  pageSize: number
): OffsetPaginatedResponse<CatalogGenre> {
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
    page,
    pageSize,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useCatalogGenres(
  page = 1,
  query = ""
): UseCatalogGenresResult {
  const queryClient = useQueryClient();
  const trimmedQuery = query.trim();
  const genresQuery = useQuery({
    queryKey: catalogKeys.genresPage(page, categoriesPageSize, trimmedQuery),
    queryFn: () =>
      getGenresPage({
        page,
        pageSize: categoriesPageSize,
        query: trimmedQuery,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (genresQuery.isPlaceholderData || !genresQuery.data?.hasNext) return;

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.genresPage(
        nextPage,
        categoriesPageSize,
        trimmedQuery
      ),
      queryFn: () =>
        getGenresPage({
          page: nextPage,
          pageSize: categoriesPageSize,
          query: trimmedQuery,
        }),
      staleTime: 60_000,
    });
  }, [
    page,
    genresQuery.data?.hasNext,
    genresQuery.isPlaceholderData,
    queryClient,
    trimmedQuery,
  ]);

  const pagination =
    genresQuery.data ?? createEmptyPagination(page, categoriesPageSize);

  return {
    genres: pagination.results,
    pagination,
    isLoading: genresQuery.isLoading,
    isFetching: genresQuery.isFetching,
    isError: genresQuery.isError,
    isPlaceholderData: genresQuery.isPlaceholderData,
    refetch: () => void genresQuery.refetch(),
  };
}
