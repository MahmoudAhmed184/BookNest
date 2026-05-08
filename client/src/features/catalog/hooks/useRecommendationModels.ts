import { useQuery } from "@tanstack/react-query";

import { listRecommendationModels } from "../services/bookService";
import type { RecommendationModel } from "../types/book";
import { catalogKeys } from "./catalog.keys";

interface UseRecommendationModelsResult {
  models: RecommendationModel[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRefreshing: boolean;
  triggerRefresh: (modelId: number) => void;
  refetch: () => void;
}

export function useRecommendationModels(
  token: string | null | undefined
): UseRecommendationModelsResult {
  const modelsQuery = useQuery({
    queryKey: catalogKeys.recommendationModels(),
    queryFn: () => listRecommendationModels(token),
    enabled: Boolean(token),
  });

  return {
    models: modelsQuery.data ?? [],
    isLoading: modelsQuery.isLoading,
    isFetching: modelsQuery.isFetching,
    isError: modelsQuery.isError,
    isRefreshing: false,
    triggerRefresh: () => undefined,
    refetch: () => void modelsQuery.refetch(),
  };
}
