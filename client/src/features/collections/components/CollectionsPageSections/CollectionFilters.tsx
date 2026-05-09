import { useId, type ReactElement } from "react";

import type {
  CollectionPrivacyFilter,
  CollectionSortOption,
  CollectionTypeFilter,
} from "../../utils/collectionPresentation";
import {
  collectionPrivacyFilterOptions,
  collectionSortOptions,
  collectionTypeFilterOptions,
} from "../../utils/collectionPresentation";
import { SearchIcon, XIcon } from "./CollectionIcons";

interface CollectionFiltersProps {
  searchTerm: string;
  typeFilter: CollectionTypeFilter;
  privacyFilter: CollectionPrivacyFilter;
  sortBy: CollectionSortOption;
  visibleCount: number;
  totalCount: number;
  isFetching: boolean;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: CollectionTypeFilter) => void;
  onPrivacyFilterChange: (value: CollectionPrivacyFilter) => void;
  onSortChange: (value: CollectionSortOption) => void;
  onResetFilters: () => void;
}

export function CollectionFilters({
  searchTerm,
  typeFilter,
  privacyFilter,
  sortBy,
  visibleCount,
  totalCount,
  isFetching,
  hasActiveFilters,
  onSearchChange,
  onTypeFilterChange,
  onPrivacyFilterChange,
  onSortChange,
  onResetFilters,
}: CollectionFiltersProps): ReactElement {
  const searchId = useId();

  return (
    <section
      className="rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/45 p-3 shadow-sm backdrop-blur-xl"
      aria-labelledby={`${searchId}-title`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2
              id={`${searchId}-title`}
              className="text-base font-bold text-primary-white"
            >
              Collection shelf
            </h2>
            <div className="flex items-center gap-2 text-sm text-primary-gray">
              {isFetching ? (
                <span role="status" aria-live="polite">
                  Syncing
                </span>
              ) : null}
              <span>
                {visibleCount.toLocaleString()} of {totalCount.toLocaleString()}
              </span>
            </div>
          </div>
          <label htmlFor={searchId} className="sr-only">
            Search collections
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-gray" />
            <input
              id={searchId}
              value={searchTerm}
              type="search"
              autoComplete="off"
              placeholder="Search by name, description, type, or privacy"
              className="field min-h-[48px] w-full rounded-lg bg-primary-black/35 pl-11 pr-4 text-primary-white"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <label className="flex flex-col gap-2 text-sm font-semibold text-primary-gray">
            Privacy
            <select
              className="field min-h-[48px] w-full rounded-lg bg-primary-black/35 text-primary-white"
              value={privacyFilter}
              onChange={(event) =>
                onPrivacyFilterChange(event.target.value as CollectionPrivacyFilter)
              }
            >
              {collectionPrivacyFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-primary-gray">
            Sort
            <select
              className="field min-h-[48px] w-full rounded-lg bg-primary-black/35 text-primary-white"
              value={sortBy}
              onChange={(event) =>
                onSortChange(event.target.value as CollectionSortOption)
              }
            >
              {collectionSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {collectionTypeFilterOptions.map((option) => {
          const isActive = typeFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm font-semibold ${
                isActive
                  ? "border-accent bg-accent/15 text-primary-white"
                  : "border-[var(--surface-glass-border)] bg-primary-black/25 text-primary-gray hover:border-accent/60 hover:text-primary-white"
              }`}
              aria-pressed={isActive}
              onClick={() => onTypeFilterChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}

        {hasActiveFilters ? (
          <button
            type="button"
            className="ml-auto inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[var(--surface-glass-border)] px-3 py-2 text-sm font-semibold text-primary-gray hover:border-accent/60 hover:text-primary-white"
            onClick={onResetFilters}
          >
            <XIcon />
            Reset
          </button>
        ) : null}
      </div>
    </section>
  );
}
