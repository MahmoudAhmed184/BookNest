import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";

import { useBookSuggestions } from "../../../features/catalog/hooks/useBookSuggestions";
import type { SearchAutocompleteTerm } from "../../../features/catalog/types/book";
import { routeBuilders } from "../../../routes/paths";

interface NavbarSearchProps {
  className?: string | undefined;
  onNavigate?: () => void;
}

export function NavbarSearch({
  className = "",
  onNavigate,
}: NavbarSearchProps): ReactElement {
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, isFetching } = useBookSuggestions(debouncedQuery, 5);
  const visibleSuggestions = useMemo(
    () => suggestions.slice(0, 5),
    [suggestions]
  );
  const hasSuggestions = visibleSuggestions.length > 0;
  const expanded = isOpen && hasSuggestions;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(visibleSuggestions.length > 0 ? 0 : -1);
  }, [visibleSuggestions]);

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
    if (suggestion.target_object_id) {
      navigate(routeBuilders.book(suggestion.target_object_id));
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
      const activeSuggestion = visibleSuggestions[activeIndex];
      if (expanded && activeSuggestion) {
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
      <input
        id={inputId}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(query.trim().length > 0)}
        onBlur={() => window.setTimeout(close, 100)}
        onKeyDown={handleKeyDown}
        className="min-h-[44px] w-full rounded-full border border-[var(--surface-glass-border)] bg-primary-black/80 px-4 py-2 text-sm text-primary-white outline-none transition placeholder:text-primary-gray focus:border-accent"
        placeholder="Search books"
        type="search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={expanded}
        aria-activedescendant={
          expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        aria-busy={isFetching}
      />
      {expanded ? (
        <ul
          id={listboxId}
          role="listbox"
          className="glass-card absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-80 overflow-y-auto p-2 shadow-xl"
        >
          {visibleSuggestions.map((book, index) => {
            const isActive = activeIndex === index;

            return (
              <li
                id={`${id}-option-${index}`}
                key={book.id}
                role="option"
                aria-selected={isActive}
                className={`cursor-pointer rounded-xl px-3 py-2 transition ${
                  isActive
                    ? "bg-secondary-black text-primary-white"
                    : "text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  navigateToSuggestion(book);
                }}
              >
                <span className="block truncate text-sm font-semibold">
                  {book.term}
                </span>
                <span className="block truncate text-xs">{book.term_type}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
