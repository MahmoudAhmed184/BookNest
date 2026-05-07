import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { searchBooks } from "../services/bookService";
import type { Book } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const searchPageSize = 24;

interface UseSearchBooksResult {
  books: Book[];
  pagination: OffsetPaginatedResponse<Book>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  isPlaceholderData: boolean;
  hasData: boolean;
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

export function useSearchBooks(
  searchTerm: string,
  page = 1,
  includeExternal = false
): UseSearchBooksResult {
  const queryClient = useQueryClient();
  const trimmedSearch = searchTerm.trim();
  const query = useQuery({
    queryKey: catalogKeys.books(
      trimmedSearch,
      page,
      searchPageSize,
      includeExternal
    ),
    queryFn: () =>
      searchBooks({
        query: trimmedSearch,
        page,
        pageSize: searchPageSize,
        includeExternal,
      }),
    enabled: trimmedSearch.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (
      trimmedSearch.length === 0 ||
      query.isPlaceholderData ||
      !query.data?.hasNext
    ) {
      return;
    }

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.books(
        trimmedSearch,
        nextPage,
        searchPageSize,
        includeExternal
      ),
      queryFn: () =>
        searchBooks({
          query: trimmedSearch,
          page: nextPage,
          pageSize: searchPageSize,
          includeExternal,
        }),
      staleTime: 60_000,
    });
  }, [
    page,
    query.data?.hasNext,
    query.isPlaceholderData,
    queryClient,
    includeExternal,
    trimmedSearch,
  ]);

  const pagination =
    query.data ?? createEmptyPagination(page, searchPageSize);

  return {
    books: pagination.results,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isPlaceholderData: query.isPlaceholderData,
    hasData: Boolean(query.data),
    refetch: () => void query.refetch(),
  };
}
