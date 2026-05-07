import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  type CatalogBookFilters,
  getGenreBooks,
} from "../services/bookService";
import type { Book } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const genreBooksPageSize = 24;

interface UseGenreBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}

function createEmptyPagination(
  page: number,
  pageSize: number
): OffsetPaginatedResponse<Book> {
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

export function useGenreBooks(
  genreId: string | undefined,
  page = 1,
  filters: CatalogBookFilters = {}
): UseGenreBooksResult {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: catalogKeys.genreBooks(genreId, page, genreBooksPageSize, filters),
    queryFn: () =>
      getGenreBooks(genreId, { page, pageSize: genreBooksPageSize, ...filters }),
    enabled: Boolean(genreId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isPlaceholderData || !query.data?.hasNext || !genreId) return;

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.genreBooks(
        genreId,
        nextPage,
        genreBooksPageSize,
        filters
      ),
      queryFn: () =>
        getGenreBooks(genreId, {
          page: nextPage,
          pageSize: genreBooksPageSize,
          ...filters,
        }),
      staleTime: 60_000,
    });
  }, [
    filters,
    genreId,
    page,
    query.data?.hasNext,
    query.isPlaceholderData,
    queryClient,
  ]);

  const pagination =
    query.data ?? createEmptyPagination(page, genreBooksPageSize);

  return {
    books: pagination.results,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    refetch: () => void query.refetch(),
  };
}
