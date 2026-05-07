import { useEffect, useRef, type ReactElement } from "react";

import { BookCardSkeleton, EmptyState, ErrorState } from "../../../components/ui";
import { FeedActivityList } from "../components/FeedActivityList";
import { usePublicFeed } from "../hooks/usePublicFeed";
import { routePaths } from "../../../routes/paths";

const skeletonKeys = [
  "feed-1",
  "feed-2",
  "feed-3",
  "feed-4",
  "feed-5",
  "feed-6",
];

function FeedSkeletonGrid(): ReactElement {
  return (
    <div
      className="catalog-grid"
      role="status"
      aria-live="polite"
      aria-label="Loading feed activity"
    >
      {skeletonKeys.map((key) => (
        <BookCardSkeleton key={key} />
      ))}
    </div>
  );
}

export default function PublicFeed(): ReactElement {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    activities,
    isLoading,
    isFetching,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePublicFeed();
  const hasActivities = activities.length > 0;

  useEffect(() => {
    const node = sentinelRef.current;
    if (
      !node ||
      !hasNextPage ||
      isFetchingNextPage ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        fetchNextPage();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

      {isLoading ? <FeedSkeletonGrid /> : null}

      {isError && !hasActivities ? (
        <ErrorState
          title="Feed could not be loaded"
          message="We could not load recent reader activity right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && !hasActivities ? (
        <EmptyState
          title="You're all caught up!"
          description="New reading activity will show up here when readers share updates."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && hasActivities ? (
        <FeedActivityList activities={activities} />
      ) : null}

      {isFetchingNextPage ? <FeedSkeletonGrid /> : null}

      {isError && hasActivities ? (
        <ErrorState
          title="More activity could not be loaded"
          message="We could not load the next feed page right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && hasActivities && !hasNextPage ? (
        <EmptyState
          title="You're all caught up!"
          description="New reading activity will appear here as readers share updates."
          className="py-8"
        />
      ) : null}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
}
