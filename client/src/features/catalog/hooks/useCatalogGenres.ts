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

export function useCatalogGenres(page = 1): UseCatalogGenresResult {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: catalogKeys.genresPage(page, categoriesPageSize),
    queryFn: () => getGenresPage({ page, pageSize: categoriesPageSize }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isPlaceholderData || !query.data?.hasNext) return;

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.genresPage(nextPage, categoriesPageSize),
      queryFn: () =>
        getGenresPage({ page: nextPage, pageSize: categoriesPageSize }),
      staleTime: 60_000,
    });
  }, [page, query.data?.hasNext, query.isPlaceholderData, queryClient]);

  const pagination =
    query.data ?? createEmptyPagination(page, categoriesPageSize);

  return {
    genres: pagination.results,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    refetch: () => void query.refetch(),
  };
}
