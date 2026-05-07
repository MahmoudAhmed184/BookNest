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
  getPopularBooks,
  getRecommendedBooks,
} from "../services/bookService";
import type { Book, CatalogGenre, RecommendedBook } from "../types/book";
import type { OffsetPaginatedResponse } from "../../../types/api";
import { catalogKeys } from "./catalog.keys";

const explorePageSize = 24;

interface UseExploreCatalogResult {
  books: Book[];
  booksPagination: OffsetPaginatedResponse<Book>;
  categories: CatalogGenre[];
  popularBooks: Book[];
  recommendations: RecommendedBook[];
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  isBooksPlaceholderData: boolean;
  isCategoriesLoading: boolean;
  isCategoriesFetching: boolean;
  isCategoriesError: boolean;
  isPopularBooksLoading: boolean;
  isPopularBooksFetching: boolean;
  isPopularBooksError: boolean;
  isRecommendationsLoading: boolean;
  isRecommendationsFetching: boolean;
  isRecommendationsError: boolean;
  refetchBooks: () => void;
  refetchCategories: () => void;
  refetchPopularBooks: () => void;
  refetchRecommendations: () => void;
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
  token?: string | null,
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
  const popularBooksQuery = useQuery({
    queryKey: catalogKeys.popularBooks(12),
    queryFn: () => getPopularBooks(12),
    staleTime: 60_000,
  });
  const categoriesQuery = useQuery({
    queryKey: catalogKeys.genres(50),
    queryFn: () => getGenres(50),
    staleTime: 60_000,
  });
  const recommendationsQuery = useQuery({
    queryKey: catalogKeys.recommendations(),
    queryFn: () => getRecommendedBooks(token),
    enabled: Boolean(token),
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
  const books = booksPagination.results;
  const uniqueBooks = books.filter(
    (_book, index) => books[index]?.isbn13 !== books[index - 1]?.isbn13
  );

  return {
    books: uniqueBooks,
    booksPagination,
    categories: categoriesQuery.data || [],
    popularBooks: popularBooksQuery.data || [],
    recommendations: recommendationsQuery.data || [],
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    isBooksPlaceholderData: booksQuery.isPlaceholderData,
    isCategoriesLoading: categoriesQuery.isLoading,
    isCategoriesFetching: categoriesQuery.isFetching,
    isCategoriesError: categoriesQuery.isError,
    isPopularBooksLoading: popularBooksQuery.isLoading,
    isPopularBooksFetching: popularBooksQuery.isFetching,
    isPopularBooksError: popularBooksQuery.isError,
    isRecommendationsLoading: recommendationsQuery.isLoading,
    isRecommendationsFetching: recommendationsQuery.isFetching,
    isRecommendationsError: recommendationsQuery.isError,
    refetchBooks: () => void booksQuery.refetch(),
    refetchCategories: () => void categoriesQuery.refetch(),
    refetchPopularBooks: () => void popularBooksQuery.refetch(),
    refetchRecommendations: () => void recommendationsQuery.refetch(),
  };
}
