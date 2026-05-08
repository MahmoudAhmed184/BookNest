import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { ApiRequestError } from "../../../lib/axios";
import {
  SearchForm,
  SearchResultsSection,
  type SortMode,
} from "../components/SearchSections";
import { useSearchBooks } from "../hooks/useSearchBooks";
import {
  routeBuilders,
  routePaths,
  type SearchRouteParams,
} from "../../../routes/paths";

const searchScrollKey = "bookNestSearchScroll";
const defaultRateLimitSeconds = 30;

function getSearchScrollPosition(): number | null {
  const state: unknown = window.history.state;

  if (!state || typeof state !== "object") return null;

  const value = (state as Record<string, unknown>)[searchScrollKey];
  return typeof value === "number" ? value : null;
}

function saveSearchScrollPosition(position: number): void {
  const state: unknown = window.history.state;
  const currentState = state && typeof state === "object"
    ? (state as Record<string, unknown>)
    : {};

  window.history.replaceState(
    { ...currentState, [searchScrollKey]: position },
    ""
  );
}

function clearSearchScrollPosition(): void {
  const state: unknown = window.history.state;
  if (!state || typeof state !== "object") return;

  const nextState = { ...(state as Record<string, unknown>) };
  delete nextState[searchScrollKey];
  window.history.replaceState(nextState, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectErrorMessages(value: unknown, messages: string[]): void {
  if (typeof value === "string" && value.trim()) {
    messages.push(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectErrorMessages(item, messages));
    return;
  }

  if (isRecord(value)) {
    Object.values(value).forEach((item) => collectErrorMessages(item, messages));
  }
}

function getValidationMessages(error: Error | null): string[] {
  if (!(error instanceof ApiRequestError) || error.status !== 400) return [];

  const messages: string[] = [];
  collectErrorMessages(error.data, messages);

  return Array.from(new Set(messages));
}

function getSearchUrl(query: string, includeExternal: boolean): string {
  const params = new URLSearchParams({ page: "1" });
  if (includeExternal) {
    params.set("include_external", "true");
  }

  return `${routeBuilders.searchQuery(query)}?${params.toString()}`;
}

export default function Search(): ReactElement {
  const { query } = useParams<SearchRouteParams>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, setPage } = usePageSearchParam();
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasScrolledAfterMount = useRef(false);

  const initialQuery = query ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [isRateLimitDismissed, setIsRateLimitDismissed] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const trimmedSearch = searchTerm.trim();
  const includeExternal = searchParams.get("include_external") === "true";

  const {
    books,
    pagination,
    isLoading,
    isFetching,
    isError,
    error,
    isPlaceholderData,
    hasData,
    refetch,
  } = useSearchBooks(trimmedSearch, page, includeExternal);
  const validationMessages = useMemo(() => getValidationMessages(error), [error]);
  const rateLimitError =
    error instanceof ApiRequestError && error.status === 429 ? error : null;
  const shouldShowRateLimit =
    Boolean(rateLimitError) && !isRateLimitDismissed && isError;
  const shouldShowResultError =
    isError && !rateLimitError && validationMessages.length === 0;

  const scrollToResults = useCallback((): void => {
    const node = resultsRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const uniqueBooks = useMemo(
    () =>
      books.filter(
        (_book, index) => books[index]?.id !== books[index - 1]?.id
      ),
    [books]
  );
  const sortedBooks = useMemo(() => {
    if (sortMode === "title") {
      return [...uniqueBooks].sort((a, b) => a.title.localeCompare(b.title));
    }

    return uniqueBooks;
  }, [sortMode, uniqueBooks]);

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      setSearchTerm(query);
    }
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!rateLimitError) {
      setRetrySeconds(0);
      setIsRateLimitDismissed(false);
      return;
    }

    setRetrySeconds(
      rateLimitError.retryAfterSeconds ?? defaultRateLimitSeconds
    );
    setIsRateLimitDismissed(false);
  }, [rateLimitError]);

  useEffect(() => {
    if (!shouldShowRateLimit || retrySeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setRetrySeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [retrySeconds, shouldShowRateLimit]);

  useEffect(() => {
    if (!hasScrolledAfterMount.current) {
      hasScrolledAfterMount.current = true;
      return;
    }

    window.requestAnimationFrame(scrollToResults);
  }, [page, scrollToResults]);

  useEffect(() => {
    if (
      isPlaceholderData ||
      pagination.totalPages === 0 ||
      page <= pagination.totalPages
    ) {
      return;
    }

    setPage(pagination.totalPages, { replace: true });
  }, [isPlaceholderData, page, pagination.totalPages, setPage]);

  useEffect(() => {
    const savedPosition = getSearchScrollPosition();
    if (savedPosition === null) return;

    window.requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition);
      clearSearchScrollPosition();
    });
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    setSearchTerm(nextQuery);

    if (nextQuery) {
      navigate(getSearchUrl(nextQuery, includeExternal));
    }
  };

  const clearSearch = (): void => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1, { replace: true });
    const params = new URLSearchParams({ page: "1" });
    if (includeExternal) {
      params.set("include_external", "true");
    }
    navigate(`${routePaths.search}?${params.toString()}`);
  };

  const rememberScroll = (): void => {
    saveSearchScrollPosition(window.scrollY);
  };

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
    setPage(1, { replace: true });
  };

  const handleIncludeExternalChange = (checked: boolean): void => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (checked) {
      nextSearchParams.set("include_external", "true");
    } else {
      nextSearchParams.delete("include_external");
    }
    nextSearchParams.set("page", "1");
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading">
          Search Books
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
          Search by title, author, genre, or ISBN to find your next read.
        </p>
      </header>

      <SearchForm
        searchInput={searchInput}
        searchTerm={searchTerm}
        includeExternal={includeExternal}
        validationMessages={validationMessages}
        resultCount={pagination.count}
        isFetchingInitialResults={isFetching && !hasData}
        onChange={handleSearchChange}
        onIncludeExternalChange={handleIncludeExternalChange}
        onClear={clearSearch}
        onSubmit={handleSubmit}
      />
      {shouldShowRateLimit ? (
        <div
          className="rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-surface)] p-4 text-sm text-primary-white"
          role="alert"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Search rate limit reached. Try again in{" "}
              <span className="font-semibold">{retrySeconds}</span> seconds.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-[36px] rounded-lg border border-secondary-gray px-3 text-xs font-semibold text-primary-gray hover:border-accent hover:text-primary-white disabled:opacity-50"
                disabled={retrySeconds > 0}
                onClick={refetch}
              >
                Retry
              </button>
              <button
                type="button"
                className="min-h-[36px] rounded-lg px-3 text-xs font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
                onClick={() => setIsRateLimitDismissed(true)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div ref={resultsRef}>
        <SearchResultsSection
          books={sortedBooks}
          searchTerm={searchTerm}
          sortMode={sortMode}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={shouldShowResultError}
          isPaginationDisabled={isPlaceholderData}
          hasData={hasData}
          pagination={pagination}
          onRetry={refetch}
          onClearSearch={clearSearch}
          onSortChange={setSortMode}
          onRememberScroll={rememberScroll}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
