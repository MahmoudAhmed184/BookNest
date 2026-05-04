import { useQuery } from "@tanstack/react-query";

import {
  getBooks,
  getGenres,
  getPopularBooks,
  getRecommendedBooks,
} from "../services/bookService";
import type { Book, CatalogGenre, RecommendedBook } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseExploreCatalogResult {
  books: Book[];
  categories: CatalogGenre[];
  popularBooks: Book[];
  recommendations: RecommendedBook[];
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
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

export function useExploreCatalog(token?: string | null): UseExploreCatalogResult {
  const booksQuery = useQuery({
    queryKey: catalogKeys.books("python"),
    queryFn: () => getBooks("python"),
  });
  const categoriesQuery = useQuery({
    queryKey: catalogKeys.genres(50),
    queryFn: () => getGenres(50),
  });
  const popularBooksQuery = useQuery({
    queryKey: catalogKeys.popularBooks(12),
    queryFn: () => getPopularBooks(12),
  });
  const recommendationsQuery = useQuery({
    queryKey: catalogKeys.recommendations(),
    queryFn: () => getRecommendedBooks(token),
    enabled: Boolean(token),
  });

  const books = booksQuery.data?.results || [];
  const uniqueBooks = books.filter(
    (_book, index) => books[index]?.isbn13 !== books[index - 1]?.isbn13
  );

  return {
    books: uniqueBooks,
    categories: categoriesQuery.data || [],
    popularBooks: popularBooksQuery.data || [],
    recommendations: recommendationsQuery.data || [],
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
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
