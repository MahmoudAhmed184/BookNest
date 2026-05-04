import { useQuery } from "@tanstack/react-query";

import { getPopularBooks } from "../services/bookService";
import type { Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseLandingCatalogResult {
  books: Book[];
  featuredBook?: Book | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useLandingCatalog(): UseLandingCatalogResult {
  const query = useQuery({
    queryKey: catalogKeys.popularBooks(12),
    queryFn: () => getPopularBooks(12),
  });
  const books = query.data || [];

  return {
    books,
    featuredBook: books[0],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
