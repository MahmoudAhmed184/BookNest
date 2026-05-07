import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getAuthors } from "../services/bookService";
import type { Author } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const authorsPageSize = 24;

interface UseAuthorsResult {
  authors: Author[];
  pagination: OffsetPaginatedResponse<Author>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}

function createEmptyPagination(
  page: number,
  pageSize: number
): OffsetPaginatedResponse<Author> {
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

export function useAuthors(query: string, page = 1): UseAuthorsResult {
  const trimmedQuery = query.trim();
  const queryClient = useQueryClient();
  const authorsQuery = useQuery({
    queryKey: catalogKeys.authors(page, authorsPageSize, trimmedQuery),
    queryFn: () =>
      getAuthors({
        page,
        pageSize: authorsPageSize,
        name__icontains: trimmedQuery || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (authorsQuery.isPlaceholderData || !authorsQuery.data?.hasNext) return;

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.authors(nextPage, authorsPageSize, trimmedQuery),
      queryFn: () =>
        getAuthors({
          page: nextPage,
          pageSize: authorsPageSize,
          name__icontains: trimmedQuery || undefined,
        }),
      staleTime: 60_000,
    });
  }, [
    authorsQuery.data?.hasNext,
    authorsQuery.isPlaceholderData,
    page,
    queryClient,
    trimmedQuery,
  ]);

  const pagination =
    authorsQuery.data ?? createEmptyPagination(page, authorsPageSize);

  return {
    authors: pagination.results,
    pagination,
    isLoading: authorsQuery.isLoading,
    isFetching: authorsQuery.isFetching,
    isError: authorsQuery.isError,
    isPlaceholderData: authorsQuery.isPlaceholderData,
    refetch: () => void authorsQuery.refetch(),
  };
}
