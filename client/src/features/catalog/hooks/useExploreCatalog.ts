import { useQuery } from "@tanstack/react-query";

import { getBooks, getRecommendedBooks } from "../../../services/bookService";
import type { Book, RecommendedBook } from "../../../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseExploreCatalogResult {
  books: Book[];
  recommendations: RecommendedBook[];
  isBooksLoading: boolean;
  isBooksFetching: boolean;
  isBooksError: boolean;
  isRecommendationsLoading: boolean;
  isRecommendationsFetching: boolean;
  isRecommendationsError: boolean;
  refetchBooks: () => void;
  refetchRecommendations: () => void;
}

export function useExploreCatalog(): UseExploreCatalogResult {
  const booksQuery = useQuery({
    queryKey: catalogKeys.books("python"),
    queryFn: () => getBooks("python"),
  });
  const recommendationsQuery = useQuery({
    queryKey: catalogKeys.recommendations(),
    queryFn: getRecommendedBooks,
  });

  const books = booksQuery.data?.results || [];
  const uniqueBooks = books.filter(
    (book, index) => books[index]?.isbn13 !== books[index - 1]?.isbn13
  );

  return {
    books: uniqueBooks,
    recommendations: recommendationsQuery.data || [],
    isBooksLoading: booksQuery.isLoading,
    isBooksFetching: booksQuery.isFetching,
    isBooksError: booksQuery.isError,
    isRecommendationsLoading: recommendationsQuery.isLoading,
    isRecommendationsFetching: recommendationsQuery.isFetching,
    isRecommendationsError: recommendationsQuery.isError,
    refetchBooks: () => void booksQuery.refetch(),
    refetchRecommendations: () => void recommendationsQuery.refetch(),
  };
}
