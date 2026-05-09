import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useSearchParams } from "react-router-dom";

import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import {
  ExploreBooksSection,
  ExploreControls,
  type ActiveExploreFilter,
  type ExploreSortMode,
} from "../components/ExploreSections";
import { FilterSidebar } from "../components/FilterSidebar";
import { useExploreCatalog } from "../hooks/useExploreCatalog";
import type { CatalogBookFilters } from "../services/bookService";
import type { Book } from "../types/book";
import { emptyCatalogFilters, type CatalogFilters } from "../types/filters";
import { getBookGenres } from "../utils/bookFacets";

function numericValue(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function publicationSortValue(book: Book): number {
  if (book.publication_date) {
    const timestamp = Date.parse(book.publication_date);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return book.publication_year ? Date.UTC(book.publication_year, 0, 1) : 0;
}

function compareTitle(a: Book, b: Book): number {
  return a.title.localeCompare(b.title);
}

function sortBooks(books: Book[], sortMode: ExploreSortMode): Book[] {
  if (sortMode === "newest") {
    return [...books].sort(
      (a, b) => publicationSortValue(b) - publicationSortValue(a) || compareTitle(a, b)
    );
  }

  if (sortMode === "highest") {
    return [...books].sort(
      (a, b) =>
        numericValue(b.average_rating) - numericValue(a.average_rating) ||
        numericValue(b.rating_count) - numericValue(a.rating_count) ||
        compareTitle(a, b)
    );
  }

  if (sortMode === "reviews") {
    return [...books].sort(
      (a, b) =>
        numericValue(b.review_count) - numericValue(a.review_count) ||
        compareTitle(a, b)
    );
  }

  if (sortMode === "az") {
    return [...books].sort(compareTitle);
  }

  return books;
}

function readCatalogFilters(searchParams: URLSearchParams): CatalogFilters {
  return {
    author: searchParams.get("author") ?? "",
    genre: searchParams.get("genre") ?? "",
    min_rating: searchParams.get("min_rating") ?? "",
    publication_year_from:
      searchParams.get("publication_year_from") ??
      searchParams.get("pub_date_from")?.slice(0, 4) ??
      "",
    publication_year_to:
      searchParams.get("publication_year_to") ??
      searchParams.get("pub_date_to")?.slice(0, 4) ??
      "",
    num_pages_min: searchParams.get("num_pages_min") ?? "",
    num_pages_max: searchParams.get("num_pages_max") ?? "",
  };
}

function writeCatalogFilters(
  searchParams: URLSearchParams,
  filters: CatalogFilters
): void {
  searchParams.delete("pub_date_from");
  searchParams.delete("pub_date_to");

  Object.entries(filters).forEach(([key, value]) => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      searchParams.set(key, trimmedValue);
      return;
    }

    searchParams.delete(key);
  });
}

function parsePositiveNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function parsePublicationYear(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!/^\d{4}$/.test(trimmedValue)) return undefined;

  const parsed = Number(trimmedValue);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function parseRating(value: string): number | undefined {
  const parsed = parsePositiveNumber(value);
  if (parsed === undefined || parsed > 5) return undefined;

  return parsed;
}

function toApiOrdering(
  sortMode: ExploreSortMode
): CatalogBookFilters["ordering"] {
  if (sortMode === "newest") return "newest";
  if (sortMode === "highest") return "rating";
  if (sortMode === "az") return "title";
  return undefined;
}

function toCatalogBookFilters(
  filters: CatalogFilters,
  query: string,
  sortMode: ExploreSortMode
): CatalogBookFilters {
  const publicationYearFrom = parsePublicationYear(filters.publication_year_from);
  const publicationYearTo = parsePublicationYear(filters.publication_year_to);
  const minPages = parsePositiveInteger(filters.num_pages_min);
  const maxPages = parsePositiveInteger(filters.num_pages_max);
  const trimmedQuery = query.trim();

  return {
    query: trimmedQuery.length >= 2 ? trimmedQuery : undefined,
    author: filters.author.trim() || undefined,
    genre: filters.genre.trim() || undefined,
    min_rating: parseRating(filters.min_rating),
    publication_year_from: publicationYearFrom,
    publication_year_to:
      publicationYearFrom !== undefined &&
      publicationYearTo !== undefined &&
      publicationYearTo < publicationYearFrom
        ? undefined
        : publicationYearTo,
    num_pages_min: minPages,
    num_pages_max:
      minPages !== undefined && maxPages !== undefined && maxPages < minPages
        ? undefined
        : maxPages,
    ordering: toApiOrdering(sortMode),
  };
}

export default function Explore(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePageSearchParam();
  const [searchInput, setSearchInput] = useState("");
  const deferredSearchInput = useDeferredValue(searchInput);
  const [sortMode, setSortMode] = useState<ExploreSortMode>("relevance");
  const filters = useMemo(
    () => readCatalogFilters(searchParams),
    [searchParams]
  );
  const serverFilters = useMemo(
    () => toCatalogBookFilters(filters, deferredSearchInput, sortMode),
    [deferredSearchInput, filters, sortMode]
  );
  const {
    books,
    booksPagination,
    categories = [],
    isBooksLoading,
    isBooksFetching,
    isBooksError,
    isBooksLoadingMore,
    refetchBooks,
  } = useExploreCatalog(page, serverFilters);

  const resetPage = useCallback((): void => {
    if (page === 1) return;

    setPage(1, { replace: true });
  }, [page, setPage]);

  useEffect(() => {
    if (
      booksPagination.totalPages === 0 ||
      page <= booksPagination.totalPages
    ) {
      return;
    }

    setPage(booksPagination.totalPages, { replace: true });
  }, [
    booksPagination.totalPages,
    page,
    setPage,
  ]);

  const genreCount = categories.length || new Set(books.flatMap(getBookGenres)).size;

  const sortedBooks = useMemo(
    () => sortBooks(books, sortMode),
    [books, sortMode]
  );

  const handleFiltersChange = useCallback(
    (nextFilters: CatalogFilters): void => {
      const nextSearchParams = new URLSearchParams(searchParams);
      writeCatalogFilters(nextSearchParams, nextFilters);
      nextSearchParams.set("page", "1");
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const activeFilters = useMemo<ActiveExploreFilter[]>(() => {
    const entries: ActiveExploreFilter[] = [];
    const addFilter = (
      key: keyof CatalogFilters,
      label: string,
      value: string
    ): void => {
      const trimmedValue = value.trim();
      if (!trimmedValue) return;

      entries.push({
        id: `${key}-${trimmedValue}`,
        label: `${label}: ${trimmedValue}`,
        onRemove: () => handleFiltersChange({ ...filters, [key]: "" }),
      });
    };

    addFilter("genre", "Genre", filters.genre);
    addFilter("author", "Author", filters.author);
    addFilter("min_rating", "Min rating", filters.min_rating);
    addFilter("publication_year_from", "Published from", filters.publication_year_from);
    addFilter("publication_year_to", "Published to", filters.publication_year_to);
    addFilter("num_pages_min", "Min pages", filters.num_pages_min);
    addFilter("num_pages_max", "Max pages", filters.num_pages_max);

    return entries;
  }, [filters, handleFiltersChange]);

  const hasActiveRefinement =
    activeFilters.length > 0 || searchInput.trim().length > 0;

  const clearAllRefinements = (): void => {
    handleFiltersChange(emptyCatalogFilters);
    setSearchInput("");
    resetPage();
  };

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
    resetPage();
  };

  const handleSortChange = (mode: ExploreSortMode): void => {
    setSortMode(mode);
    resetPage();
  };

  const loadMore = useCallback((): void => {
    setPage(page + 1);
  }, [page, setPage]);

  return (
    <div className="flex flex-col gap-10 py-10 animate-fade-up sm:py-12">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Discover BookNest
          </p>
          <h1 className="display-heading">
            Explore
          </h1>
          <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
            Search the catalog, refine by book details, and keep every shelf
            easy to scan.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="settings-panel min-w-[132px] px-4 py-3">
            <p className="text-2xl font-bold text-primary-white">{booksPagination.count}</p>
            <p className="text-xs text-primary-gray">Books</p>
          </div>
          <div className="settings-panel min-w-[132px] px-4 py-3">
            <p className="text-2xl font-bold text-primary-white">{genreCount}</p>
            <p className="text-xs text-primary-gray">Genres</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <FilterSidebar
          filters={filters}
          resultCount={booksPagination.count}
          onChange={handleFiltersChange}
        />
        <div className="flex min-w-0 flex-col gap-5">
          <ExploreControls
            searchInput={searchInput}
            resultCount={sortedBooks.length}
            totalCount={booksPagination.count}
            activeFilters={activeFilters}
            sortMode={sortMode}
            isUpdating={isBooksFetching && books.length > 0}
            onSearchChange={handleSearchChange}
            onClearSearch={() => {
              setSearchInput("");
              resetPage();
            }}
            onSortChange={handleSortChange}
            onClearAll={clearAllRefinements}
          />
          <ExploreBooksSection
            books={sortedBooks}
            isLoading={isBooksLoading}
            isFetching={isBooksFetching}
            isError={isBooksError}
            isLoadingMore={isBooksLoadingMore}
            hasActiveRefinement={hasActiveRefinement}
            pagination={booksPagination}
            onRetry={refetchBooks}
            onClearRefinements={clearAllRefinements}
            onLoadMore={loadMore}
          />
        </div>
      </div>

    </div>
  );
}
