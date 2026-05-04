import type { FormEvent, ReactElement } from "react";

import { BookCard } from "../../../components/BookCard";
import { BookCardSkeleton } from "../../../components/BookCardSkeleton";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { InlineSpinner } from "../../../components/InlineSpinner";
import { routeBuilders, routePaths } from "../../../routes";
import type { Book } from "../../../types/book";

export type SortMode = "relevance" | "title";

interface SearchFormProps {
  searchInput: string;
  searchTerm: string;
  isFetchingInitialResults: boolean;
  resultCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SearchForm({
  searchInput,
  searchTerm,
  isFetchingInitialResults,
  onChange,
  onClear,
  onSubmit,
}: SearchFormProps): ReactElement {
  const hasActiveSearch = searchTerm.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label htmlFor="book-search" className="text-sm font-medium text-primary-white">
        Search query
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative grow">
          <input
            id="book-search"
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
                <path
                  fillRule="evenodd"
                  d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.2 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L9.6 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11 10l3.3-3.3a1 1 0 0 0-1.4-1.4L9.6 8.6 6.3 5.3Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!searchInput.trim() || isFetchingInitialResults}
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
        >
          {isFetchingInitialResults ? <InlineSpinner /> : null}
          Search
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
        <p role="status" aria-live="polite">
          {hasActiveSearch
            ? `Searching for "${searchTerm.trim()}"`
            : "Enter at least one keyword to begin."}
        </p>
        <p>{searchInput.length} characters</p>
      </div>
    </form>
  );
}

interface SearchResultsSectionProps {
  books: Book[];
  searchTerm: string;
  sortMode: SortMode;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
  onRetry: () => void;
  onClearSearch: () => void;
  onSortChange: (mode: SortMode) => void;
  onRememberScroll: () => void;
}

export function SearchResultsSection({
  books,
  searchTerm,
  sortMode,
  isLoading,
  isFetching,
  isError,
  hasData,
  onRetry,
  onClearSearch,
  onSortChange,
  onRememberScroll,
}: SearchResultsSectionProps): ReactElement {
  const trimmedSearch = searchTerm.trim();
  const hasActiveSearch = trimmedSearch.length > 0;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="search-results-title">
      <SearchResultsHeader
        hasActiveSearch={hasActiveSearch}
        resultCount={books.length}
        searchTerm={trimmedSearch}
        sortMode={sortMode}
        isUpdating={isFetching && hasData}
        onSortChange={onSortChange}
      />
      {isLoading ? <SearchSkeletonGrid /> : null}
      {isError ? (
        <ErrorState
          title="Search is unavailable"
          message="We could not load search results right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!hasActiveSearch && !isLoading ? (
        <EmptyState
          title="Start with a title, author, or genre"
          description="Your results will appear here as you type."
          actionLabel="Browse categories"
          actionTo={routePaths.categories}
        />
      ) : null}
      {hasActiveSearch && !isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={`No books found for "${trimmedSearch}"`}
          description="Try different keywords, fewer words, or another author name."
          actionLabel="Clear search"
          onAction={onClearSearch}
        />
      ) : null}
      {books.length > 0 && !isError ? (
        <SearchResultsGrid books={books} onRememberScroll={onRememberScroll} />
      ) : null}
    </section>
  );
}

interface SearchResultsHeaderProps {
  hasActiveSearch: boolean;
  resultCount: number;
  searchTerm: string;
  sortMode: SortMode;
  isUpdating: boolean;
  onSortChange: (mode: SortMode) => void;
}

function SearchResultsHeader({
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
        <h2 id="search-results-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
          Search Results
        </h2>
        {hasActiveSearch ? (
          <p className="mt-2 text-sm text-primary-gray" role="status">
            {resultCount} results for "{searchTerm}"
            {isUpdating ? " · updating" : ""}
          </p>
        ) : null}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-primary-gray">
          Sort results
        </legend>
        <div className="flex rounded-xl bg-secondary-black p-1">
          {(["relevance", "title"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSortChange(mode)}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                sortMode === mode
                  ? "btn-accent-v text-primary-white shadow-md"
                  : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
              }`}
              aria-pressed={sortMode === mode}
            >
              {mode === "relevance" ? "Relevance" : "Title A-Z"}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function SearchSkeletonGrid(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface SearchResultsGridProps {
  books: Book[];
  onRememberScroll: () => void;
}

function SearchResultsGrid({
  books,
  onRememberScroll,
}: SearchResultsGridProps): ReactElement {
  return (
    <div
      id="search-results"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {books.map((book) => (
        <BookCard
          key={book.isbn13}
          to={routeBuilders.book(book.isbn13)}
          title={book.title}
          author={book.author}
          coverSrc={book.cover_img}
          className="h-full"
          onClick={onRememberScroll}
        />
      ))}
    </div>
  );
}
