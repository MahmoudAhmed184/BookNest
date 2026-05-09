import { useEffect, useMemo, useRef, useState, useTransition, type ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../components/ui";
import { routePaths } from "../../../routes/paths";
import { FeedActivityList } from "../components/FeedActivityList";
import { usePublicFeed } from "../hooks/usePublicFeed";
import type { FeedEvent } from "../types/book";

type FeedFilter = "all" | "ratings" | "reviews";

interface FeedFilterOption {
  label: string;
  value: FeedFilter;
}

const feedFilters: FeedFilterOption[] = [
  { label: "All", value: "all" },
  { label: "Ratings", value: "ratings" },
  { label: "Reviews", value: "reviews" },
];

const compactFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function eventMatchesFilter(activity: FeedEvent, filter: FeedFilter): boolean {
  if (filter === "ratings") return /rating|rated/i.test(activity.event_type);
  if (filter === "reviews") return /review/i.test(activity.event_type);
  return true;
}

function FeedSkeletonList({ count = 4 }: { count?: number }): ReactElement {
  return (
    <div
      className="flex flex-col gap-5"
      role="status"
      aria-live="polite"
      aria-label="Loading feed activity"
    >
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="glass-card p-4 sm:p-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
            <div className="h-12 w-12 rounded-xl animate-shimmer" />
            <div className="min-w-0 space-y-5">
              <div className="space-y-2">
                <div className="h-4 max-w-xl rounded-full animate-shimmer" />
                <div className="h-3 max-w-xs rounded-full animate-shimmer" />
              </div>
              <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
                <div className="h-36 w-24 rounded-xl animate-shimmer" />
                <div className="min-w-0 space-y-3">
                  <div className="h-7 max-w-lg rounded-full animate-shimmer" />
                  <div className="h-4 max-w-sm rounded-full animate-shimmer" />
                  <div className="h-4 max-w-2xl rounded-full animate-shimmer" />
                  <div className="h-4 max-w-xl rounded-full animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function FeedFilters({
  counts,
  filter,
  onChange,
}: {
  counts: Record<FeedFilter, number>;
  filter: FeedFilter;
  onChange: (value: FeedFilter) => void;
}): ReactElement {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[var(--surface-glass-border)] bg-secondary-black/70 p-1">
      {feedFilters.map((option) => {
        const isActive = option.value === filter;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${
              isActive
                ? "btn-accent-v text-primary-white shadow-md"
                : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
            }`}
          >
            <span>{option.label}</span>
            <span className="rounded-lg bg-primary-black/60 px-2 py-0.5 text-xs">
              {compactFormatter.format(counts[option.value])}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PublicFeed(): ReactElement {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [isFilterPending, startFilterTransition] = useTransition();
  const {
    activities,
    loadedCount,
    isLoading,
    isFetching,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePublicFeed();
  const counts = useMemo(
    () => ({
      all: loadedCount,
      ratings: activities.filter((activity) => eventMatchesFilter(activity, "ratings")).length,
      reviews: activities.filter((activity) => eventMatchesFilter(activity, "reviews")).length,
    }),
    [activities, loadedCount]
  );
  const visibleActivities = useMemo(
    () => activities.filter((activity) => eventMatchesFilter(activity, filter)),
    [activities, filter]
  );
  const hasActivities = activities.length > 0;
  const hasVisibleActivities = visibleActivities.length > 0;

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
      { root: null, rootMargin: "360px 0px", threshold: 0 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleFilterChange = (nextFilter: FeedFilter): void => {
    startFilterTransition(() => setFilter(nextFilter));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12 animate-fade-up">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-accent">Community activity</p>
          <h1 className="display-heading">Reader feed</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-primary-gray sm:text-base">
            Follow the newest ratings, reviews, shelves, and reading lists from your BookNest circle.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--surface-glass-border)] bg-secondary-black/60 p-2 shadow-md">
          {[
            { label: "Loaded", value: counts.all },
            { label: "Ratings", value: counts.ratings },
            { label: "Reviews", value: counts.reviews },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-primary-black/55 px-3 py-3">
              <p className="font-display text-2xl font-bold leading-none text-primary-white">
                {compactFormatter.format(stat.value)}
              </p>
              <p className="mt-1 text-xs font-semibold text-primary-gray">{stat.label}</p>
            </div>
          ))}
        </div>
      </header>

      <section
        className="sticky top-20 z-10 -mx-1 flex flex-col gap-3 rounded-xl border border-[var(--surface-glass-border)] bg-primary-black/90 p-2 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Feed controls"
      >
        <FeedFilters counts={counts} filter={filter} onChange={handleFilterChange} />
        <p className="px-2 text-sm text-primary-gray" aria-live="polite">
          {hasVisibleActivities
            ? `${compactFormatter.format(visibleActivities.length)} shown`
            : "No matching activity loaded"}
        </p>
      </section>

      {isLoading ? <FeedSkeletonList /> : null}

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
          title="The feed is quiet"
          description="New reading activity will show up here when readers share updates."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && hasVisibleActivities ? (
        <div
          className={`transition-opacity duration-200 ${isFilterPending ? "opacity-70" : "opacity-100"}`}
          aria-busy={isFilterPending || isFetchingNextPage}
        >
          <FeedActivityList activities={visibleActivities} />
        </div>
      ) : null}

      {!isLoading && hasActivities && !hasVisibleActivities && hasNextPage ? (
        <EmptyState
          title={`No ${filter} in the loaded feed`}
          description="Load more activity or switch filters to keep browsing."
          actionLabel="Load more"
          onAction={fetchNextPage}
          className="py-10"
        />
      ) : null}

      {!isLoading && hasActivities && !hasVisibleActivities && !hasNextPage ? (
        <EmptyState
          title={`No ${filter} in the loaded feed`}
          description="Try another filter to keep browsing reader activity."
          className="py-10"
        />
      ) : null}

      {isFetchingNextPage ? <FeedSkeletonList count={2} /> : null}

      {isError && hasActivities ? (
        <ErrorState
          title="More activity could not be loaded"
          message="We could not load the next feed page right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && hasActivities && hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center py-2">
          <button
            type="button"
            onClick={fetchNextPage}
            disabled={isFetchingNextPage}
            className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm"
            aria-busy={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && hasActivities && !hasNextPage ? (
        <p className="py-4 text-center text-sm text-primary-gray">
          You are caught up.
        </p>
      ) : null}
    </div>
  );
}
