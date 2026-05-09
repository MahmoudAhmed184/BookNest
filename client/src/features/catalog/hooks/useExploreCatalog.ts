import { useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  type CatalogBookFilters,
  getCatalogBooks,
  getGenres,
} from "../services/bookService";
import type { Book, CatalogGenre } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import { catalogKeys } from "./catalog.keys";

const explorePageSize = 24;

interface UseExploreCatalogResult {
  books: Book[];
  booksPagination: OffsetPaginatedResponse<Book>;
  categories: CatalogGenre[];
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  isBooksLoadingMore: boolean;
  isCategoriesLoading: boolean;
  isCategoriesFetching: boolean;
  isCategoriesError: boolean;
  refetchBooks: () => void;
  refetchCategories: () => void;
}

export function useExploreCatalog(
  page = 1,
  filters: CatalogBookFilters = {}
): UseExploreCatalogResult {
  const targetPage = Math.max(1, page);
  const booksQuery = useInfiniteQuery({
    queryKey: catalogKeys.catalogBooksInfinite(explorePageSize, filters),
    queryFn: ({ pageParam }) =>
      getCatalogBooks({ page: pageParam, pageSize: explorePageSize, ...filters }),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
    staleTime: 60_000,
  });
  const categoriesQuery = useQuery({
    queryKey: catalogKeys.genres(50),
    queryFn: () => getGenres(50),
    staleTime: 60_000,
  });
  const pages = booksQuery.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = booksQuery;

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

  const booksPagination = mergeOffsetPages<Book>(pages, {
    page: targetPage,
    pageSize: explorePageSize,
  });

  return {
    books: booksPagination.results,
    booksPagination,
    categories: categoriesQuery.data || [],
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    isBooksLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    isCategoriesLoading: categoriesQuery.isLoading,
    isCategoriesFetching: categoriesQuery.isFetching,
    isCategoriesError: categoriesQuery.isError,
    refetchBooks: () => void booksQuery.refetch(),
    refetchCategories: () => void categoriesQuery.refetch(),
  };
}
