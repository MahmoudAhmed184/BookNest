import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  SearchForm,
  SearchResultsSection,
  type SortMode,
} from "../../features/catalog/components/SearchSections";
import { useSearchBooks } from "../../features/catalog/hooks/useSearchBooks";
import { routeBuilders, type SearchRouteParams } from "../../routes";

const searchScrollKey = "booknest:search-scroll";

export default function Search(): ReactElement {
  const { query } = useParams<SearchRouteParams>();
  const navigate = useNavigate();

  const initialQuery = query ?? "";
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const trimmedSearch = searchTerm.trim();

  const { books, isLoading, isFetching, isError, hasData, refetch } =
    useSearchBooks(trimmedSearch);

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
      navigate(routeBuilders.searchQuery(nextQuery));
    }
  };

  const clearSearch = (): void => {
    setSearchInput("");
    setSearchTerm("");
  };

  const rememberScroll = (): void => {
    sessionStorage.setItem(searchScrollKey, String(window.scrollY));
  };

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

      <SearchForm
        searchInput={searchInput}
        searchTerm={searchTerm}
        resultCount={sortedBooks.length}
        isFetchingInitialResults={isFetching && !hasData}
        onChange={setSearchInput}
        onClear={clearSearch}
        onSubmit={handleSubmit}
      />
      <SearchResultsSection
        books={sortedBooks}
        searchTerm={searchTerm}
        sortMode={sortMode}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        hasData={hasData}
        onRetry={refetch}
        onClearSearch={clearSearch}
        onSortChange={setSortMode}
        onRememberScroll={rememberScroll}
      />
    </div>
  );
}
