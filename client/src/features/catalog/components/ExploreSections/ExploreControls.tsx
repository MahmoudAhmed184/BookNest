import type { ReactElement } from "react";

export type ExploreSortMode = "relevance" | "newest" | "highest" | "reviews" | "az";

export interface ActiveExploreFilter {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface ExploreControlsProps {
  searchInput: string;
  resultCount: number;
  totalCount: number;
  activeFilters: ActiveExploreFilter[];
  sortMode: ExploreSortMode;
  isUpdating: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSortChange: (mode: ExploreSortMode) => void;
  onClearAll: () => void;
}

const sortOptions: Array<{ value: ExploreSortMode; label: string; ariaLabel: string }> = [
  { value: "relevance", label: "Relevance", ariaLabel: "Sort by relevance" },
  { value: "newest", label: "Newest", ariaLabel: "Sort by newest publication" },
  { value: "highest", label: "Highest Rated", ariaLabel: "Sort by highest rated" },
  { value: "reviews", label: "Most Reviews", ariaLabel: "Sort by most reviews" },
  { value: "az", label: "A-Z", ariaLabel: "Sort alphabetically from A to Z" },
];

export function ExploreControls({
  searchInput,
  resultCount,
  totalCount,
  activeFilters,
  sortMode,
  isUpdating,
  onSearchChange,
  onClearSearch,
  onSortChange,
  onClearAll,
}: ExploreControlsProps): ReactElement {
  const hasSearch = searchInput.trim().length > 0;
  const hasActiveRefinement = hasSearch || activeFilters.length > 0;

  return (
    <section className="settings-panel flex flex-col gap-4 p-4 sm:p-5" aria-label="Explore controls">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <label htmlFor="explore-search" className="text-sm font-medium text-primary-white">
            Search within Explore
          </label>
          <div className="relative mt-2">
            <input
              id="explore-search"
              type="search"
              className="field w-full pr-12 text-primary-white placeholder-primary-gray focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black"
              placeholder="Title, author, or genre"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              autoComplete="off"
            />
            {hasSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-primary-gray hover:text-primary-white"
                aria-label="Clear explore search"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.2 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L9.6 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11 10l3.3-3.3a1 1 0 0 0-1.4-1.4L9.6 8.6 6.3 5.3Z" clipRule="evenodd" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <label htmlFor="explore-sort" className="flex min-w-48 flex-col gap-2 text-sm font-medium text-primary-white">
          Sort
          <select
            id="explore-sort"
            value={sortMode}
            onChange={(event) => onSortChange(event.target.value as ExploreSortMode)}
            className="field min-h-[44px] text-primary-white"
            aria-label={sortOptions.find((option) => option.value === sortMode)?.ariaLabel ?? "Sort books"}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-primary-gray" role="status" aria-live="polite">
          Showing <span className="font-semibold text-primary-white">{resultCount}</span> of{" "}
          <span className="font-semibold text-primary-white">{totalCount}</span> books
          {isUpdating ? " while updating" : ""}
        </p>
        {isUpdating ? <span className="text-xs text-primary-gray">Updating</span> : null}
      </div>

      {hasActiveRefinement ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-secondary-gray/50 pt-4" aria-label="Active filters">
          <span className="text-xs font-bold uppercase text-primary-gray">Active</span>
          {hasSearch ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="min-h-[32px] rounded-full bg-primary-black px-3 py-1 text-xs font-semibold text-primary-white hover:bg-secondary-black"
              aria-label="Remove search refinement"
            >
              Search: {searchInput.trim()}
            </button>
          ) : null}
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={filter.onRemove}
              className="min-h-[32px] rounded-full bg-primary-black px-3 py-1 text-xs font-semibold text-primary-white hover:bg-secondary-black"
              aria-label={`Remove ${filter.label} filter`}
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-[32px] rounded-full border border-secondary-gray px-3 py-1 text-xs font-semibold text-primary-gray hover:border-accent hover:text-primary-white"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </section>
  );
}
