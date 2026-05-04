import type { ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../../components/ui";
import { routePaths } from "../../../../routes/paths";
import type { Book } from "../../types/book";
import { SearchResultsGrid } from "./SearchResultsGrid";
import { SearchResultsHeader, type SortMode } from "./SearchResultsHeader";
import { SearchSkeletonGrid } from "./SearchSkeletonGrid";

export interface SearchResultsSectionProps {
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
        <ErrorState title="Search is unavailable" message="We could not load search results right now." onRetry={onRetry} isRetrying={isFetching} />
      ) : null}
      {!hasActiveSearch && !isLoading ? (
        <EmptyState
          title="Start with a title, author, or genre"
          description="Your results will appear here as you type."
          actionLabel="Browse by mood"
          actionTo={routePaths.explore}
        />
      ) : null}
      {hasActiveSearch && !isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={`No books found for "${trimmedSearch}"`}
          description="Try fewer words, another author, or browse by mood to loosen the search."
          actionLabel="Browse by mood"
          actionTo={routePaths.explore}
          onAction={onClearSearch}
        />
      ) : null}
      {books.length > 0 && !isError ? (
        <SearchResultsGrid books={books} onRememberScroll={onRememberScroll} />
      ) : null}
    </section>
  );
}
