import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSearchSuggestions } from "../../../features/catalog/hooks/useBookSuggestions";
import type { SearchAutocompleteTerm } from "../../../features/catalog/types/book";
import { routeBuilders } from "../../../routes/paths";

interface NavbarSearchProps {
  className?: string | undefined;
  onNavigate?: () => void;
  showIdlePanel?: boolean | undefined;
}

function SearchIcon(): ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BookIcon(): ReactElement {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </svg>
  );
}

function AuthorIcon(): ReactElement {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function GenreIcon(): ReactElement {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  );
}

function QueryIcon(): ReactElement {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function suggestionIcon(termType: string): ReactElement {
  switch (termType.toLowerCase()) {
    case "author":
      return <AuthorIcon />;
    case "genre":
      return <GenreIcon />;
    case "query":
      return <QueryIcon />;
    default:
      return <BookIcon />;
  }
}

function suggestionLabel(termType: string): string {
  return termType.replace(/_/g, " ");
}

function suggestionStatusMessage(
  isError: boolean,
  isFetching: boolean,
  canRequestSuggestions: boolean
): string {
  if (isError) return "Suggestions are temporarily unavailable.";
  if (isFetching) return "Searching...";
  if (canRequestSuggestions) return "No suggestions found.";
  return "Type a title, author, genre, or ISBN.";
}

export function NavbarSearch({
  className = "",
  onNavigate,
  showIdlePanel = true,
}: NavbarSearchProps): ReactElement {
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, isFetching, isError } = useSearchSuggestions(
    debouncedQuery,
    { limit: 8 }
  );
  const visibleSuggestions = useMemo(
    () => suggestions.slice(0, 8),
    [suggestions]
  );
  const hasSuggestions = visibleSuggestions.length > 0;
  const hasQuery = query.trim().length > 0;
  const canRequestSuggestions = debouncedQuery.trim().length >= 2;
  const activeSuggestion = visibleSuggestions[activeIndex];
  const showPanel =
    isOpen && (showIdlePanel || hasQuery || hasSuggestions || isFetching || isError);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(visibleSuggestions.length > 0 ? 0 : -1);
  }, [visibleSuggestions]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const close = (): void => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const navigateToSearch = (searchQuery: string): void => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    navigate(routeBuilders.searchQuery(trimmedQuery));
    close();
    onNavigate?.();
  };

  const navigateToSuggestion = (suggestion: SearchAutocompleteTerm): void => {
    const targetId = suggestion.target_object_id;
    const termType = suggestion.term_type.toLowerCase();

    if ((termType === "book" || termType === "isbn") && targetId) {
      navigate(routeBuilders.book(targetId));
    } else if (termType === "author" && targetId) {
      navigate(routeBuilders.author(targetId));
    } else if (termType === "genre" && targetId) {
      navigate(routeBuilders.genreBooks(targetId));
    } else {
      navigate(routeBuilders.searchQuery(suggestion.term));
    }

    setQuery(suggestion.term);
    close();
    onNavigate?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "ArrowDown" && hasSuggestions) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % visibleSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && hasSuggestions) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? visibleSuggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && activeSuggestion) {
        navigateToSuggestion(activeSuggestion);
        return;
      }

      navigateToSearch(query);
    }
  };

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        navigateToSearch(query);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search books
      </label>
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-primary-gray">
        <SearchIcon />
      </span>
      <input
        id={inputId}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(showIdlePanel || hasQuery)}
        onBlur={() => window.setTimeout(close, 100)}
        onKeyDown={handleKeyDown}
        className="min-h-12 w-full rounded-full border border-[var(--surface-glass-border)] bg-primary-black/70 py-3 pl-14 pr-5 text-base text-primary-white outline-none shadow-inner transition placeholder:text-primary-gray focus:border-accent focus:bg-primary-black"
        placeholder="Search books, authors, genres"
        type="search"
        autoComplete="off"
        data-search-shortcut-target="true"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        aria-busy={isFetching}
      />
      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-3xl border border-[var(--surface-glass-border)] bg-secondary-black shadow-xl">
          <div className="flex min-h-20 items-center gap-4 border-b border-[var(--surface-glass-border)] px-6 py-4 text-primary-white">
            <span className="text-primary-gray">
              <SearchIcon />
            </span>
            <span className="truncate text-lg">
              {query.trim() || "Search books, authors, genres"}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto p-4">
            {!hasSuggestions ? (
              <p className="flex min-h-24 items-center justify-center px-4 text-center text-base text-primary-gray">
                {suggestionStatusMessage(
                  isError,
                  isFetching,
                  canRequestSuggestions
                )}
              </p>
            ) : null}
            <p className="px-2 py-2 text-sm font-bold text-primary-gray">
              Suggestions
            </p>
            <div id={listboxId} role="listbox" className="space-y-1">
              {visibleSuggestions.map((suggestion, index) => {
                const isActive = activeIndex === index;

                return (
                  <button
                    id={`${id}-option-${index}`}
                    key={`${suggestion.term_type}-${suggestion.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`flex min-h-12 w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-left transition ${
                      isActive
                        ? "bg-primary-black text-primary-white"
                        : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      navigateToSuggestion(suggestion);
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-black text-accent">
                        {suggestionIcon(suggestion.term_type)}
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {suggestion.term}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold uppercase text-primary-gray">
                      {suggestionLabel(suggestion.term_type)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
