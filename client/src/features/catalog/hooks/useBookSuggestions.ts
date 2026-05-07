import { useQuery } from "@tanstack/react-query";

import { getSuggestions } from "../services/bookService";
import type { Book } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseBookSuggestionsResult {
  suggestions: Book[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export function useBookSuggestions(
  query: string,
  limit = 5
): UseBookSuggestionsResult {
  const trimmedQuery = query.trim();
  const suggestionsQuery = useQuery({
    queryKey: catalogKeys.suggestions(trimmedQuery, limit),
    queryFn: () => getSuggestions(trimmedQuery, limit),
    enabled: trimmedQuery.length > 0,
    staleTime: 5 * 60_000,
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoading: suggestionsQuery.isLoading,
    isFetching: suggestionsQuery.isFetching,
    isError: suggestionsQuery.isError,
  };
}
