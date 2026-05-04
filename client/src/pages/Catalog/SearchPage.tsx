import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { searchBooks } from "../../services/bookService";
import BookCard from "../../components/BookCard";
import BookCardSkeleton from "../../components/BookCardSkeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import InlineSpinner from "../../components/InlineSpinner";

type SortMode = "relevance" | "title";

const searchScrollKey = "booknest:search-scroll";

export default function Search() {
  const { query } = useParams<"query">();
  const navigate = useNavigate();

  const initialQuery = query ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");

  const trimmedSearch = searchTerm.trim();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["books", trimmedSearch],
    queryFn: () => searchBooks(trimmedSearch),
    enabled: trimmedSearch.length > 0,
  });

  const books = data?.results || [];
  const uniqueBooks = useMemo(
    () =>
      books.filter(
        (book, index) => books[index]?.isbn13 !== books[index - 1]?.isbn13
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
    const savedPosition = sessionStorage.getItem(searchScrollKey);
    if (!savedPosition) return;

    window.requestAnimationFrame(() => {
      window.scrollTo(0, Number(savedPosition));
      sessionStorage.removeItem(searchScrollKey);
    });
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    setSearchTerm(nextQuery);

    if (nextQuery) {
      navigate(`/search/${encodeURIComponent(nextQuery)}`);
    }
  };

  const clearSearch = (): void => {
    setSearchInput("");
    setSearchTerm("");
  };

  const rememberScroll = (): void => {
    sessionStorage.setItem(searchScrollKey, String(window.scrollY));
  };

  const hasActiveSearch = trimmedSearch.length > 0;

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Search Books
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
          Search by title, author, genre, or ISBN to find your next read.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              onChange={(event) => setSearchInput(event.target.value)}
              value={searchInput}
              autoComplete="off"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
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
            disabled={!searchInput.trim() || (isFetching && !data)}
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isFetching && !data ? <InlineSpinner /> : null}
            Search
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
          <p role="status" aria-live="polite">
            {hasActiveSearch
              ? `Searching for "${trimmedSearch}"`
              : "Enter at least one keyword to begin."}
          </p>
          <p>{searchInput.length} characters</p>
        </div>
      </form>

      <section className="flex flex-col gap-5" aria-labelledby="search-results-title">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="search-results-title"
              className="text-xl font-semibold text-primary-white sm:text-2xl"
            >
              Search Results
            </h2>
            {hasActiveSearch ? (
              <p className="mt-2 text-sm text-primary-gray" role="status">
                {sortedBooks.length} results for "{trimmedSearch}"
                {isFetching && data ? " · updating" : ""}
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
                  onClick={() => setSortMode(mode)}
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

        {isLoading ? (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="status"
            aria-live="polite"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <BookCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {isError ? (
          <ErrorState
            title="Search is unavailable"
            message="We could not load search results right now."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : null}

        {!hasActiveSearch && !isLoading ? (
          <EmptyState
            title="Start with a title, author, or genre"
            description="Your results will appear here as you type."
            actionLabel="Browse categories"
            actionTo="/categories"
          />
        ) : null}

        {hasActiveSearch && !isLoading && !isError && sortedBooks.length === 0 ? (
          <EmptyState
            title={`No books found for "${trimmedSearch}"`}
            description="Try different keywords, fewer words, or another author name."
            actionLabel="Clear search"
            onAction={clearSearch}
          />
        ) : null}

        {sortedBooks.length > 0 && !isError ? (
          <div
            id="search-results"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {sortedBooks.map((book) => (
              <BookCard
                key={book.isbn13}
                to={`/book/${book.isbn13}`}
                title={book.title}
                author={book.author}
                coverSrc={book.cover_img}
                className="h-full"
                onClick={rememberScroll}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
