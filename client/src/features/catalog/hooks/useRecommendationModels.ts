import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  listRecommendationModels,
  triggerRecommendationRefresh,
} from "../services/bookService";
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
  const queryClient = useQueryClient();
  const modelsQuery = useQuery({
    queryKey: catalogKeys.recommendationModels(),
    queryFn: () => listRecommendationModels(token),
    enabled: Boolean(token),
  });
  const refreshMutation = useMutation({
    mutationFn: (modelId: number) => triggerRecommendationRefresh(modelId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.recommendationModels(),
      });
    },
  });

  return {
    models: modelsQuery.data ?? [],
    isLoading: modelsQuery.isLoading,
    isFetching: modelsQuery.isFetching,
    isError: modelsQuery.isError,
    isRefreshing: refreshMutation.isPending,
    triggerRefresh: (modelId) => refreshMutation.mutate(modelId),
    refetch: () => void modelsQuery.refetch(),
  };
}
