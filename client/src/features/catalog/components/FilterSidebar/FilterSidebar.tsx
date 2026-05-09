import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { catalogKeys } from "../../hooks/catalog.keys";
import { getGenreOptions } from "../../services/bookService";
import type { CatalogGenre } from "../../types/book";
import { emptyCatalogFilters, type CatalogFilters } from "../../types/filters";

interface FilterSidebarProps {
  filters: CatalogFilters;
  resultCount: number;
  onChange: (filters: CatalogFilters) => void;
}

const ratingOptions = [
  { value: "", label: "Any" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
] as const;

const fieldClass =
  "field h-11 w-full rounded-lg border-secondary-gray/40 bg-primary-black/30 px-3 text-sm text-primary-white placeholder:text-primary-gray focus:border-accent focus:bg-primary-black/60";

function countActiveFilters(filters: CatalogFilters): number {
  return Object.values(filters).filter((value) => value.trim().length > 0).length;
}

function updateFilter(
  filters: CatalogFilters,
  key: keyof CatalogFilters,
  value: string
): CatalogFilters {
  return {
    ...filters,
    [key]: value,
  };
}

function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function parseInteger(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function yearValidationMessage(filters: CatalogFilters): string | null {
  const from = filters.publication_year_from.trim();
  const to = filters.publication_year_to.trim();

  if (from && from.length < 4) return "Use a 4-digit start year.";
  if (to && to.length < 4) return "Use a 4-digit end year.";

  const fromYear = parseInteger(from);
  const toYear = parseInteger(to);
  if (fromYear !== null && toYear !== null && toYear < fromYear) {
    return "End year must be after start year.";
  }

  return null;
}

function pageValidationMessage(filters: CatalogFilters): string | null {
  const minPages = parseInteger(filters.num_pages_min);
  const maxPages = parseInteger(filters.num_pages_max);

  if (minPages !== null && minPages < 1) return "Minimum pages must be 1 or more.";
  if (maxPages !== null && maxPages < 1) return "Maximum pages must be 1 or more.";
  if (minPages !== null && maxPages !== null && maxPages < minPages) {
    return "Maximum pages must be greater than minimum pages.";
  }

  return null;
}

interface GenreSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function GenreSearch({
  value,
  onChange,
}: GenreSearchProps): ReactElement {
  const inputId = useId();
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const canSearch = trimmedQuery.length > 0;
  const genreOptionsQuery = useQuery({
    queryKey: catalogKeys.genreOptions(trimmedQuery, 12),
    queryFn: () => getGenreOptions(trimmedQuery, 12),
    enabled: isOpen && canSearch,
    staleTime: 5 * 60_000,
  });
  const options = genreOptionsQuery.data ?? [];

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent): void => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery, options.length]);

  const selectOption = (genre: CatalogGenre): void => {
    onChange(genre.name);
    setQuery(genre.name);
    setIsOpen(false);
  };

  const clearGenre = (): void => {
    onChange("");
    setQuery("");
    setActiveIndex(0);
    setIsOpen(false);
  };

  const moveActiveOption = (direction: 1 | -1): void => {
    if (options.length === 0) return;

    setActiveIndex((currentIndex) =>
      Math.min(options.length - 1, Math.max(0, currentIndex + direction))
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search genres
      </label>
      <input
        id={inputId}
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            moveActiveOption(1);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActiveOption(-1);
          }

          if (event.key === "Enter" && isOpen && options[activeIndex]) {
            event.preventDefault();
            selectOption(options[activeIndex]);
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={`${fieldClass} pr-20`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && options[activeIndex]
            ? `${listboxId}-${options[activeIndex].id}`
            : undefined
        }
        placeholder="Search genres"
        autoComplete="off"
      />
      {query.trim() || value ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex min-h-8 -translate-y-1/2 items-center rounded-md px-2 text-xs font-semibold text-primary-gray hover:bg-secondary-black hover:text-primary-white"
          onClick={clearGenre}
        >
          Clear
        </button>
      ) : null}

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Genre search results"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-72 overflow-y-auto rounded-lg border border-secondary-gray/80 bg-primary-black p-1 shadow-2xl"
        >
          {!canSearch ? (
            <p className="px-3 py-3 text-sm text-primary-gray">
              Type a genre name to search.
            </p>
          ) : null}
          {canSearch && genreOptionsQuery.isFetching ? (
            <p className="px-3 py-3 text-sm text-primary-gray" role="status">
              Searching genres...
            </p>
          ) : null}
          {canSearch && genreOptionsQuery.isError ? (
            <p className="px-3 py-3 text-sm text-red-300">
              Genres could not be loaded.
            </p>
          ) : null}
          {canSearch &&
          !genreOptionsQuery.isFetching &&
          !genreOptionsQuery.isError &&
          options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-primary-gray">
              No genres found.
            </p>
          ) : null}
          {options.map((genre, index) => {
            const isSelected = value === genre.name;
            const isActive = index === activeIndex;

            return (
              <button
                id={`${listboxId}-${genre.id}`}
                key={genre.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`flex min-h-[40px] w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${
                  isSelected || isActive
                    ? "bg-accent text-primary-black"
                    : "text-primary-white hover:bg-secondary-black"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(genre)}
              >
                <span className="min-w-0 truncate">{genre.name}</span>
                <span
                  className={`shrink-0 text-xs ${
                    isSelected || isActive
                      ? "text-primary-black/70"
                      : "text-primary-gray"
                  }`}
                >
                  {genre.books_count?.toLocaleString() ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function FilterSidebar({
  filters,
  resultCount,
  onChange,
}: FilterSidebarProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const yearHintId = useId();
  const pageHintId = useId();
  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const yearError = useMemo(() => yearValidationMessage(filters), [filters]);
  const pageError = useMemo(() => pageValidationMessage(filters), [filters]);
  const clearFilters = (): void => onChange(emptyCatalogFilters);
  const setFilter = (key: keyof CatalogFilters, value: string): void => {
    onChange(updateFilter(filters, key, value));
  };

  return (
    <aside
      className="settings-panel h-fit p-4 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
      aria-labelledby="filters-title"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-h-[44px] min-w-0 flex-1 rounded-lg text-left"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="catalog-filters"
        >
          <span className="min-w-0">
            <span id="filters-title" className="block text-lg font-bold text-primary-white">
              Filters
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-primary-gray" aria-live="polite">
              <span>{resultCount.toLocaleString()} matching books</span>
              {hasActiveFilters ? (
                <span className="rounded-full bg-primary-black/50 px-2 py-0.5 text-xs font-semibold text-accent">
                  {activeFilterCount} active
                </span>
              ) : null}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-lg font-semibold text-accent hover:bg-primary-black"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="catalog-filters"
            aria-label={isOpen ? "Collapse filters" : "Expand filters"}
          >
            {isOpen ? "−" : "+"}
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
              onClick={clearFilters}
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div
        id="catalog-filters"
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className={isOpen ? "overflow-visible" : "overflow-hidden"}>
          <FilterGroup
            title="Genre"
            hasSelection={filters.genre.trim().length > 0}
            onClear={() => setFilter("genre", "")}
          >
            <GenreSearch
              value={filters.genre}
              onChange={(nextGenre) => setFilter("genre", nextGenre)}
            />
          </FilterGroup>

          <FilterGroup
            title="Author"
            hasSelection={filters.author.trim().length > 0}
            onClear={() => setFilter("author", "")}
          >
            <input
              value={filters.author}
              onChange={(event) => setFilter("author", event.currentTarget.value)}
              className={fieldClass}
              placeholder="Author name"
              aria-label="Filter by author"
              autoComplete="off"
            />
          </FilterGroup>

          <FilterGroup
            title="Rating"
            hasSelection={filters.min_rating.trim().length > 0}
            onClear={() => setFilter("min_rating", "")}
          >
            <div
              className="grid grid-cols-4 gap-2"
              role="group"
              aria-label="Minimum rating"
            >
              {ratingOptions.map((option) => {
                const isSelected = filters.min_rating === option.value;

                return (
                  <button
                    key={option.value || "any"}
                    type="button"
                    className={`min-h-10 rounded-lg border px-2 text-sm font-semibold ${
                      isSelected
                        ? "border-accent bg-accent text-primary-black"
                        : "border-secondary-gray/60 bg-primary-black/30 text-primary-gray hover:border-accent hover:text-primary-white"
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => setFilter("min_rating", option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup
            title="Publication Year"
            hasSelection={
              filters.publication_year_from.trim().length > 0 ||
              filters.publication_year_to.trim().length > 0
            }
            onClear={() =>
              onChange({
                ...filters,
                publication_year_from: "",
                publication_year_to: "",
              })
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                From
                <input
                  value={filters.publication_year_from}
                  onChange={(event) =>
                    setFilter(
                      "publication_year_from",
                      digitsOnly(event.currentTarget.value, 4)
                    )
                  }
                  className={fieldClass}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1990"
                  aria-invalid={Boolean(yearError)}
                  aria-describedby={yearHintId}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                To
                <input
                  value={filters.publication_year_to}
                  onChange={(event) =>
                    setFilter(
                      "publication_year_to",
                      digitsOnly(event.currentTarget.value, 4)
                    )
                  }
                  className={fieldClass}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2026"
                  aria-invalid={Boolean(yearError)}
                  aria-describedby={yearHintId}
                />
              </label>
            </div>
            <p
              id={yearHintId}
              className={`text-xs ${yearError ? "text-red-300" : "text-primary-gray"}`}
            >
              {yearError ?? "Use 4-digit years."}
            </p>
          </FilterGroup>

          <FilterGroup
            title="Page Count"
            hasSelection={
              filters.num_pages_min.trim().length > 0 ||
              filters.num_pages_max.trim().length > 0
            }
            onClear={() =>
              onChange({ ...filters, num_pages_min: "", num_pages_max: "" })
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                Minimum
                <input
                  value={filters.num_pages_min}
                  onChange={(event) =>
                    setFilter(
                      "num_pages_min",
                      digitsOnly(event.currentTarget.value, 5)
                    )
                  }
                  className={fieldClass}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="100"
                  aria-invalid={Boolean(pageError)}
                  aria-describedby={pageHintId}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                Maximum
                <input
                  value={filters.num_pages_max}
                  onChange={(event) =>
                    setFilter(
                      "num_pages_max",
                      digitsOnly(event.currentTarget.value, 5)
                    )
                  }
                  className={fieldClass}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="500"
                  aria-invalid={Boolean(pageError)}
                  aria-describedby={pageHintId}
                />
              </label>
            </div>
            {pageError ? (
              <p id={pageHintId} className="text-xs text-red-300">
                {pageError}
              </p>
            ) : (
              <p id={pageHintId} className="text-xs text-primary-gray">
                Leave either side blank for an open range.
              </p>
            )}
          </FilterGroup>
        </div>
      </div>
    </aside>
  );
}

interface FilterGroupProps {
  title: string;
  children: ReactNode;
  hasSelection: boolean;
  onClear: () => void;
}

function FilterGroup({
  title,
  children,
  hasSelection,
  onClear,
}: FilterGroupProps): ReactElement {
  return (
    <section className="border-t border-secondary-gray/40 py-4" aria-label={title}>
      <div className="mb-2 flex min-h-[32px] items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase text-primary-white">{title}</h3>
        {hasSelection ? (
          <button
            type="button"
            className="min-h-[28px] rounded-full px-2 py-1 text-xs font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
