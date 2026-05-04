import { useQuery } from "@tanstack/react-query";

import { searchBooks } from "../services/bookService";
import type { Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseSearchBooksResult {
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
  refetch: () => void;
}

export function useSearchBooks(searchTerm: string): UseSearchBooksResult {
  const trimmedSearch = searchTerm.trim();
  const query = useQuery({
    queryKey: catalogKeys.books(trimmedSearch),
    queryFn: () => searchBooks(trimmedSearch),
    enabled: trimmedSearch.length > 0,
  });

  return {
    books: query.data?.results || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    hasData: Boolean(query.data),
    refetch: () => void query.refetch(),
  };
}
