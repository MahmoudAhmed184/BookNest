import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  listRecommendationModels,
  refreshRecommendations,
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
    mutationFn: (modelId: number) =>
      refreshRecommendations(
        { model_id: modelId, n_recommendations: 12, async: true },
        token
      ),
    onSuccess: () => {
      toast.success("Recommendation refresh triggered.");
      window.setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: catalogKeys.recommendations(),
        });
      }, 5_000);
    },
    onError: () => {
      toast.error("Couldn't trigger recommendation refresh. Try again.");
    },
  });

  return {
    models: modelsQuery.data ?? [],
    isLoading: modelsQuery.isLoading,
    isFetching: modelsQuery.isFetching,
    isError: modelsQuery.isError,
    isRefreshing: refreshMutation.isPending,
    triggerRefresh: (modelId: number) => refreshMutation.mutate(modelId),
    refetch: () => void modelsQuery.refetch(),
  };
}
