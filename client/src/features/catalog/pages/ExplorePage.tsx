import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useSearchParams } from "react-router-dom";

import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  ExploreBooksSection,
  ExploreControls,
  GenreCarousel,
  PopularBooksGrid,
  RecommendationsSection,
  type ActiveExploreFilter,
  type ExploreSortMode,
} from "../components/ExploreSections";
import { FilterSidebar } from "../components/FilterSidebar";
import { useExploreCatalog } from "../hooks/useExploreCatalog";
import type { CatalogBookFilters } from "../services/bookService";
import type { Book } from "../types/book";
import { emptyCatalogFilters, type CatalogFilters } from "../types/filters";
import { getAuthorNames, getBookGenres } from "../utils/bookFacets";

type FacetCounts = {
  genres: Record<string, number>;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function bookMatchesSearch(book: Book, query: string): boolean {
  if (!query) return true;

  const searchableText = [
    book.title,
    getAuthorNames(book),
    ...getBookGenres(book),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}

function buildFacetCounts(books: Book[]): FacetCounts {
  const counts: FacetCounts = {
    genres: {},
  };

  books.forEach((book) => {
    getBookGenres(book).forEach((genre) => {
      counts.genres[genre] = (counts.genres[genre] ?? 0) + 1;
    });
  });

  return counts;
}

function sortBooks(books: Book[], sortMode: ExploreSortMode): Book[] {
  if (sortMode === "title") {
    return [...books].sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortMode === "author") {
    return [...books].sort((a, b) =>
      getAuthorNames(a).localeCompare(getAuthorNames(b))
    );
  }

  return books;
}

function readCatalogFilters(searchParams: URLSearchParams): CatalogFilters {
  return {
    author: searchParams.get("author") ?? "",
    genre: searchParams.get("genre") ?? "",
    min_rating: searchParams.get("min_rating") ?? "",
    pub_date_from: searchParams.get("pub_date_from") ?? "",
    pub_date_to: searchParams.get("pub_date_to") ?? "",
    num_pages_min: searchParams.get("num_pages_min") ?? "",
    num_pages_max: searchParams.get("num_pages_max") ?? "",
  };
}

function writeCatalogFilters(
  searchParams: URLSearchParams,
  filters: CatalogFilters
): void {
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

function toCatalogBookFilters(filters: CatalogFilters): CatalogBookFilters {
  return {
    author: filters.author.trim() || undefined,
    genre: filters.genre.trim() || undefined,
    min_rating: parsePositiveNumber(filters.min_rating),
    pub_date_from: filters.pub_date_from.trim() || undefined,
    pub_date_to: filters.pub_date_to.trim() || undefined,
    num_pages_min: parsePositiveNumber(filters.num_pages_min),
    num_pages_max: parsePositiveNumber(filters.num_pages_max),
  };
}

export default function Explore(): ReactElement {
  const { token } = useOptionalAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePageSearchParam();
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledAfterMount = useRef(false);
  const [searchInput, setSearchInput] = useState("");
  const [sortMode, setSortMode] = useState<ExploreSortMode>("recommended");
  const filters = useMemo(
    () => readCatalogFilters(searchParams),
    [searchParams]
  );
  const serverFilters = useMemo(
    () => toCatalogBookFilters(filters),
    [filters]
  );
  const {
    books,
    booksPagination,
    categories = [],
    popularBooks = [],
    recommendations,
    isBooksLoading,
    isBooksFetching,
    isBooksError,
    isBooksPlaceholderData,
    isRecommendationsLoading,
    isRecommendationsFetching,
    isRecommendationsError,
    refetchBooks,
    refetchRecommendations,
  } = useExploreCatalog(token, page, serverFilters);

  const scrollToResults = useCallback((): void => {
    const node = resultsRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const resetPage = useCallback((): void => {
    if (page === 1) return;

    setPage(1, { replace: true });
  }, [page, setPage]);

  useEffect(() => {
    if (!hasScrolledAfterMount.current) {
      hasScrolledAfterMount.current = true;
      return;
    }

    window.requestAnimationFrame(scrollToResults);
  }, [page, scrollToResults]);

  useEffect(() => {
    if (
      isBooksPlaceholderData ||
      booksPagination.totalPages === 0 ||
      page <= booksPagination.totalPages
    ) {
      return;
    }

    setPage(booksPagination.totalPages, { replace: true });
  }, [
    booksPagination.totalPages,
    isBooksPlaceholderData,
    page,
    setPage,
  ]);

  const genreOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 10).map((category) => category.name);
    }

    return Array.from(new Set(books.flatMap(getBookGenres))).slice(0, 10);
  }, [books, categories]);

  const facetCounts = useMemo(() => buildFacetCounts(books), [books]);

  const filteredBooks = useMemo(
    () => {
      const query = normalizeSearch(searchInput);
      return books.filter((book) => bookMatchesSearch(book, query));
    },
    [books, searchInput]
  );

  const sortedBooks = useMemo(
    () => sortBooks(filteredBooks, sortMode),
    [filteredBooks, sortMode]
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
    addFilter("pub_date_from", "Published from", filters.pub_date_from);
    addFilter("pub_date_to", "Published to", filters.pub_date_to);
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
            Browse popular genres, search the catalog, and keep every shelf easy
            to scan.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="settings-panel min-w-[132px] px-4 py-3">
            <p className="text-2xl font-bold text-primary-white">{booksPagination.count}</p>
            <p className="text-xs text-primary-gray">Books</p>
          </div>
          <div className="settings-panel min-w-[132px] px-4 py-3">
            <p className="text-2xl font-bold text-primary-white">{genreOptions.length}</p>
            <p className="text-xs text-primary-gray">Genres</p>
          </div>
        </div>
      </header>

      {categories.length > 0 ? <GenreCarousel categories={categories.slice(0, 10)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <FilterSidebar
          filters={filters}
          genreOptions={genreOptions}
          facetCounts={facetCounts}
          resultCount={booksPagination.count}
          onChange={handleFiltersChange}
        />
        <div ref={resultsRef} className="flex min-w-0 flex-col gap-5">
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
            isPaginationDisabled={isBooksPlaceholderData}
            hasActiveRefinement={hasActiveRefinement}
            pagination={booksPagination}
            onRetry={refetchBooks}
            onClearRefinements={clearAllRefinements}
            onPageChange={setPage}
          />
        </div>
      </div>

      <RecommendationsSection
        recommendations={recommendations}
        isLoading={isRecommendationsLoading}
        isFetching={isRecommendationsFetching}
        isError={isRecommendationsError}
        onRetry={refetchRecommendations}
      />
      {popularBooks.length > 0 ? <PopularBooksGrid books={popularBooks} /> : null}
    </div>
  );
}
