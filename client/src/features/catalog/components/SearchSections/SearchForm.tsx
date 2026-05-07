import type { FormEvent, ReactElement } from "react";

import { ToggleSwitch } from "../../../../components/ui";

export interface SearchFormProps {
  searchInput: string;
  searchTerm: string;
  includeExternal: boolean;
  validationMessages: string[];
  isFetchingInitialResults: boolean;
  resultCount: number;
  onChange: (value: string) => void;
  onIncludeExternalChange: (checked: boolean) => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SearchForm({
  searchInput,
  searchTerm,
  includeExternal,
  validationMessages,
  isFetchingInitialResults,
  resultCount,
  onChange,
  onIncludeExternalChange,
  onClear,
  onSubmit,
}: SearchFormProps): ReactElement {
  const hasActiveSearch = searchTerm.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="glass-card flex flex-col gap-4 p-4 sm:p-5">
      <label htmlFor="book-search" className="text-sm font-medium text-primary-white">
        Search query
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative grow">
          <input
            id="book-search"
            data-search-shortcut-target="true"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="search-results"
            className="field w-full pr-12 text-primary-white placeholder-primary-gray focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-black"
            placeholder="Search for books"
            onChange={(event) => onChange(event.target.value)}
            value={searchInput}
            autoComplete="off"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.2 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L9.6 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11 10l3.3-3.3a1 1 0 0 0-1.4-1.4L9.6 8.6 6.3 5.3Z" clipRule="evenodd" />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!searchInput.trim() || isFetchingInitialResults}
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
        >
          {isFetchingInitialResults ? "Searching..." : "Search"}
        </button>
      </div>
      <ToggleSwitch
        checked={includeExternal}
        label="Include external results"
        description="Search outside the local catalog when available."
        onChange={onIncludeExternalChange}
      />
      {validationMessages.length > 0 ? (
        <div
          className="rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-surface)] p-3 text-sm text-primary-white"
          role="alert"
        >
          <p className="font-semibold">Search filters need attention</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-primary-gray">
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
        <p role="status" aria-live="polite">
          {hasActiveSearch ? `Searching for "${searchTerm.trim()}"` : "Enter at least one keyword to begin."}
        </p>
        <p className="rounded-full bg-primary-black px-3 py-1 text-primary-white" aria-live="polite">
          {resultCount} results
        </p>
      </div>
    </form>
  );
}
