import type { ReactElement } from "react";

import { EmptyState, ErrorState, Pagination } from "../../../../components/ui";
import { routePaths } from "../../../../routes/paths";
import type { OffsetPaginatedResponse } from "../../../../types/api";
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
  isPaginationDisabled: boolean;
  hasData: boolean;
  pagination: OffsetPaginatedResponse<Book>;
  onRetry: () => void;
  onClearSearch: () => void;
  onSortChange: (mode: SortMode) => void;
  onRememberScroll: () => void;
  onPageChange: (page: number) => void;
}

export function SearchResultsSection({
  books,
  searchTerm,
  sortMode,
  isLoading,
  isFetching,
  isError,
  isPaginationDisabled,
  hasData,
  pagination,
  onRetry,
  onClearSearch,
  onSortChange,
  onRememberScroll,
  onPageChange,
}: SearchResultsSectionProps): ReactElement {
  const trimmedSearch = searchTerm.trim();
  const hasActiveSearch = trimmedSearch.length > 0;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="search-results-title">
      <SearchResultsHeader
        hasActiveSearch={hasActiveSearch}
        resultCount={pagination.count}
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
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
        />
      ) : null}
      {hasActiveSearch && !isLoading && !isError && books.length === 0 ? (
        <EmptyState
          title={`No books found for "${trimmedSearch}"`}
          description="Try fewer words, another author, or browse the catalog by genre."
          actionLabel="Explore catalog"
          actionTo={routePaths.explore}
          onAction={onClearSearch}
        />
      ) : null}
      {books.length > 0 && !isError ? (
        <SearchResultsGrid books={books} onRememberScroll={onRememberScroll} />
      ) : null}
      {hasActiveSearch && !isLoading && !isError ? (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasPreviousPage={pagination.hasPrevious}
          hasNextPage={pagination.hasNext}
          onPageChange={onPageChange}
          isDisabled={isPaginationDisabled}
          ariaLabel="Search results pagination"
        />
      ) : null}
    </section>
  );
}
