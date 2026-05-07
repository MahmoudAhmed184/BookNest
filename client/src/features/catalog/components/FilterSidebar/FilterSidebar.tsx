import { useState, type ReactElement, type ReactNode } from "react";

import { emptyCatalogFilters, type CatalogFilters } from "../../types/filters";

export interface FilterFacetCounts {
  genres: Record<string, number>;
}

export interface FilterSidebarProps {
  filters: CatalogFilters;
  genreOptions: string[];
  facetCounts: FilterFacetCounts;
  resultCount: number;
  onChange: (filters: CatalogFilters) => void;
}

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

export function FilterSidebar({
  filters,
  genreOptions,
  facetCounts,
  resultCount,
  onChange,
}: FilterSidebarProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const clearFilters = (): void => onChange(emptyCatalogFilters);

  return (
    <aside className="settings-panel h-fit p-4 lg:sticky lg:top-28" aria-labelledby="filters-title">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-left"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="catalog-filters"
        >
          <span className="min-w-0">
            <span id="filters-title" className="block text-base font-bold text-primary-white">
              Filters
            </span>
            <span className="text-xs text-primary-gray" aria-live="polite">
              {resultCount} matching books
              {hasActiveFilters ? ` · ${activeFilterCount} active` : ""}
            </span>
          </span>
          <span aria-hidden="true" className="text-lg font-semibold text-accent">
            {isOpen ? "−" : "+"}
          </span>
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            className="min-h-[44px] rounded-lg px-3 text-xs font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
            onClick={clearFilters}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div
        id="catalog-filters"
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <FilterGroup
            title="Genre"
            hasSelection={filters.genre.trim().length > 0}
            onClear={() => onChange({ ...filters, genre: "" })}
          >
            <select
              value={filters.genre}
              onChange={(event) =>
                onChange(updateFilter(filters, "genre", event.target.value))
              }
              className="field w-full text-primary-white"
              aria-label="Filter by genre"
            >
              <option value="">All genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre} ({facetCounts.genres[genre] ?? 0})
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup
            title="Author"
            hasSelection={filters.author.trim().length > 0}
            onClear={() => onChange({ ...filters, author: "" })}
          >
            <input
              value={filters.author}
              onChange={(event) =>
                onChange(updateFilter(filters, "author", event.target.value))
              }
              className="field w-full text-primary-white placeholder-primary-gray"
              placeholder="Author name"
              aria-label="Filter by author"
            />
          </FilterGroup>

          <FilterGroup
            title="Rating"
            hasSelection={filters.min_rating.trim().length > 0}
            onClear={() => onChange({ ...filters, min_rating: "" })}
          >
            <input
              value={filters.min_rating}
              onChange={(event) =>
                onChange(updateFilter(filters, "min_rating", event.target.value))
              }
              className="field w-full text-primary-white placeholder-primary-gray"
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="Minimum rating"
              aria-label="Filter by minimum rating"
            />
          </FilterGroup>

          <FilterGroup
            title="Publication Date"
            hasSelection={
              filters.pub_date_from.trim().length > 0 ||
              filters.pub_date_to.trim().length > 0
            }
            onClear={() =>
              onChange({ ...filters, pub_date_from: "", pub_date_to: "" })
            }
          >
            <div className="grid gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                From
                <input
                  value={filters.pub_date_from}
                  onChange={(event) =>
                    onChange(
                      updateFilter(filters, "pub_date_from", event.target.value)
                    )
                  }
                  className="field w-full text-primary-white"
                  type="date"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-primary-gray">
                To
                <input
                  value={filters.pub_date_to}
                  onChange={(event) =>
                    onChange(updateFilter(filters, "pub_date_to", event.target.value))
                  }
                  className="field w-full text-primary-white"
                  type="date"
                />
              </label>
            </div>
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
            <div className="grid gap-2">
              <input
                value={filters.num_pages_min}
                onChange={(event) =>
                  onChange(
                    updateFilter(filters, "num_pages_min", event.target.value)
                  )
                }
                className="field w-full text-primary-white placeholder-primary-gray"
                type="number"
                min="1"
                placeholder="Minimum pages"
                aria-label="Filter by minimum pages"
              />
              <input
                value={filters.num_pages_max}
                onChange={(event) =>
                  onChange(
                    updateFilter(filters, "num_pages_max", event.target.value)
                  )
                }
                className="field w-full text-primary-white placeholder-primary-gray"
                type="number"
                min="1"
                placeholder="Maximum pages"
                aria-label="Filter by maximum pages"
              />
            </div>
          </FilterGroup>
          {hasActiveFilters ? (
            <button
              type="button"
              className="mt-3 min-h-[44px] w-full rounded-lg px-3 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : null}
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
    <section className="border-t border-secondary-gray/40 pt-4" aria-label={title}>
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
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export default FilterSidebar;
