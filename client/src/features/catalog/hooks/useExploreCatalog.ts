import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  type CatalogBookFilters,
  getCatalogBooks,
  getGenres,
} from "../services/bookService";
import type { Book, CatalogGenre } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const explorePageSize = 24;

interface UseExploreCatalogResult {
  books: Book[];
  booksPagination: OffsetPaginatedResponse<Book>;
  categories: CatalogGenre[];
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  isBooksPlaceholderData: boolean;
  isCategoriesLoading: boolean;
  isCategoriesFetching: boolean;
  isCategoriesError: boolean;
  refetchBooks: () => void;
  refetchCategories: () => void;
}

function createEmptyPagination<T>(
  page: number,
  pageSize: number
): OffsetPaginatedResponse<T> {
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

export function useExploreCatalog(
  page = 1,
  filters: CatalogBookFilters = {}
): UseExploreCatalogResult {
  const queryClient = useQueryClient();
  const booksQuery = useQuery({
    queryKey: catalogKeys.catalogBooks(page, explorePageSize, filters),
    queryFn: () => getCatalogBooks({ page, pageSize: explorePageSize, ...filters }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const categoriesQuery = useQuery({
    queryKey: catalogKeys.genres(50),
    queryFn: () => getGenres(50),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (booksQuery.isPlaceholderData || !booksQuery.data?.hasNext) return;

    const nextPage = page + 1;
    void queryClient.prefetchQuery({
      queryKey: catalogKeys.catalogBooks(nextPage, explorePageSize, filters),
      queryFn: () =>
        getCatalogBooks({ page: nextPage, pageSize: explorePageSize, ...filters }),
      staleTime: 60_000,
    });
  }, [
    booksQuery.data?.hasNext,
    booksQuery.isPlaceholderData,
    filters,
    page,
    queryClient,
  ]);

  const booksPagination =
    booksQuery.data ?? createEmptyPagination<Book>(page, explorePageSize);

  return {
    books: booksPagination.results,
    booksPagination,
    categories: categoriesQuery.data || [],
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    isBooksPlaceholderData: booksQuery.isPlaceholderData,
    isCategoriesLoading: categoriesQuery.isLoading,
    isCategoriesFetching: categoriesQuery.isFetching,
    isCategoriesError: categoriesQuery.isError,
    refetchBooks: () => void booksQuery.refetch(),
    refetchCategories: () => void categoriesQuery.refetch(),
  };
}
