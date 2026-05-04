import type { ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../components/ui";
import { FeedActivityList } from "../components/FeedActivityList";
import { usePublicFeed } from "../hooks/usePublicFeed";
import { routePaths } from "../../../routes/paths";

const skeletonKeys = ["feed-1", "feed-2", "feed-3", "feed-4"];

export default function PublicFeed(): ReactElement {
  const { activities, isLoading, isFetching, isError, refetch } = usePublicFeed();

  return (
    <div className="py-12 flex flex-col gap-8 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading">
          Public Feed
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          See what readers are picking up across BookNest.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" role="status" aria-live="polite">
          {skeletonKeys.map((key) => (
            <div key={key} className="glass-card h-36 animate-shimmer" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Feed could not be loaded"
          message="We could not load recent reader activity right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && activities.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          description="New reading activity will show up here when readers share updates."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && !isError && activities.length > 0 ? (
        <FeedActivityList activities={activities} />
      ) : null}
    </div>
  );
}
