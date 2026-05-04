import type { ReactElement } from "react";

export type SortMode = "relevance" | "title";

export interface SearchResultsHeaderProps {
  hasActiveSearch: boolean;
  resultCount: number;
  searchTerm: string;
  sortMode: SortMode;
  isUpdating: boolean;
  onSortChange: (mode: SortMode) => void;
}

export function SearchResultsHeader({
  hasActiveSearch,
  resultCount,
  searchTerm,
  sortMode,
  isUpdating,
  onSortChange,
}: SearchResultsHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 id="search-results-title" className="text-xl font-bold text-primary-white sm:text-2xl">
          Search Results
        </h2>
        {hasActiveSearch ? (
          <p className="mt-2 text-sm text-primary-gray" role="status" aria-live="polite">
            {resultCount} results for "{searchTerm}"{isUpdating ? " · updating" : ""}
          </p>
        ) : null}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-primary-gray">Sort results</legend>
        <div className="flex rounded-xl bg-secondary-black p-1">
          {(["relevance", "title"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSortChange(mode)}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium ${
                sortMode === mode
                  ? "btn-accent-v text-primary-white shadow-md"
                  : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
              }`}
              aria-pressed={sortMode === mode}
              aria-label={`Sort by ${mode === "relevance" ? "relevance" : "title A to Z"}`}
            >
              {mode === "relevance" ? "Relevance" : "Title A-Z"}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
