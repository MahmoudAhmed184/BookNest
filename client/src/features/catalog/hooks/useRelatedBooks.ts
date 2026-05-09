import { useQuery } from "@tanstack/react-query";

import { getRelatedBooks } from "../services/bookService";
import type { Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseRelatedBooksResult {
  relatedBooks: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useRelatedBooks(id: string | undefined): UseRelatedBooksResult {
  const query = useQuery({
    queryKey: catalogKeys.relatedBooks(id),
    queryFn: () => getRelatedBooks(id),
    enabled: Boolean(id),
  });

  return {
    relatedBooks: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
