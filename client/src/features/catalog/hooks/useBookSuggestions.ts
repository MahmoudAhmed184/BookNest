import { useQuery } from "@tanstack/react-query";

import { getSuggestions } from "../services/bookService";
import type { SearchAutocompleteTerm } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseSearchSuggestionsResult {
  suggestions: SearchAutocompleteTerm[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

interface UseSearchSuggestionsOptions {
  limit?: number | undefined;
  minLength?: number | undefined;
  type?: string | undefined;
}

export function useSearchSuggestions(
  query: string,
  {
    limit = 8,
    minLength = 2,
    type,
  }: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsResult {
  const trimmedQuery = query.trim();
  const suggestionsQuery = useQuery({
    queryKey: catalogKeys.suggestions(trimmedQuery, limit, type ?? "all"),
    queryFn: () =>
      type
        ? getSuggestions(trimmedQuery, limit, type)
        : getSuggestions(trimmedQuery, limit),
    enabled: trimmedQuery.length >= minLength,
    staleTime: 5 * 60_000,
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoading: suggestionsQuery.isLoading,
    isFetching: suggestionsQuery.isFetching,
    isError: suggestionsQuery.isError,
  };
}

export function useBookSuggestions(
  query: string,
  limit = 5
): UseSearchSuggestionsResult {
  return useSearchSuggestions(query, { limit, minLength: 1 });
}
