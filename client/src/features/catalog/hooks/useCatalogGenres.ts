import { useQuery } from "@tanstack/react-query";

import { getGenres } from "../services/bookService";
import type { CatalogGenre } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseCatalogGenresResult {
  genres: CatalogGenre[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useCatalogGenres(limit = 50): UseCatalogGenresResult {
  const query = useQuery({
    queryKey: catalogKeys.genres(limit),
    queryFn: () => getGenres(limit),
  });

  return {
    genres: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
