import type { ReactElement } from "react";

import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { useRecommendationModels } from "../hooks/useRecommendationModels";

function formatMetric(value: number | string | null | undefined): string {
  if (typeof value === "number") return value.toFixed(3);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed.toFixed(3) : value;
  }
  return "n/a";
}

export default function AdminRecommendationsPage(): ReactElement {
  const { token } = useAuth();
  const {
    models,
    isLoading,
    isFetching,
    isError,
    isRefreshing,
    triggerRefresh,
    refetch,
  } = useRecommendationModels(token);

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading text-3xl sm:text-4xl">
          Recommendation Models
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray">
          Inspect model metrics and trigger recommendation generation.
        </p>
      </header>

      {isLoading ? (
        <div className="py-8" role="status" aria-live="polite">
          <InlineSpinner />
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Recommendation models could not be loaded"
          message="We could not load the model list right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && models.length === 0 ? (
        <EmptyState
          title="No recommendation models"
          description="Trained model records will appear here."
        />
      ) : null}

      {!isLoading && !isError && models.length > 0 ? (
        <div className="settings-panel overflow-x-auto p-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-primary-gray">
              <tr>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">RMSE</th>
                <th className="px-3 py-2">MAE</th>
                <th className="px-3 py-2">Minimum ratings</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-gray/50">
              {models.map((model) => (
                <tr key={model.id} className="text-primary-white">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{model.model_type}</div>
                    <div className="text-xs text-primary-gray">
                    {model.generated_at ?? model.created_at ?? `Model ${model.id}`}
                    </div>
                  </td>
                  <td className="px-3 py-3">{model.is_active ? "Yes" : "No"}</td>
                  <td className="px-3 py-3">{formatMetric(model.rmse)}</td>
                  <td className="px-3 py-3">{formatMetric(model.mae)}</td>
                  <td className="px-3 py-3">
                    {model.min_ratings_threshold ?? "n/a"}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="btn btn-accent-v inline-flex min-h-[40px] items-center justify-center px-4 text-sm disabled:opacity-50"
                      disabled={isRefreshing}
                      onClick={() => triggerRefresh(model.id)}
                    >
                      {isRefreshing ? "Triggering..." : "Trigger refresh"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
