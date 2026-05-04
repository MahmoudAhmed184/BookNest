import { useState, type ReactElement } from "react";

import { moodOptions, paceOptions } from "../../data/moodColors";
import type { CatalogFilters, MoodTag, PaceTag } from "../../types/filters";
import { FilterOption } from "./FilterOption";

export interface FilterSidebarProps {
  filters: CatalogFilters;
  genreOptions: string[];
  resultCount: number;
  onChange: (filters: CatalogFilters) => void;
}

function toggleString(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function toggleMood(values: MoodTag[], value: MoodTag): MoodTag[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function togglePace(values: PaceTag[], value: PaceTag): PaceTag[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function FilterSidebar({
  filters,
  genreOptions,
  resultCount,
  onChange,
}: FilterSidebarProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className="glass-card h-fit p-4 lg:sticky lg:top-28" aria-labelledby="filters-title">
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-2 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="catalog-filters"
      >
        <span>
          <span id="filters-title" className="block text-base font-bold text-primary-white">
            Filters
          </span>
          <span className="text-xs text-primary-gray" aria-live="polite">
            {resultCount} matching books
          </span>
        </span>
        <span aria-hidden="true" className="text-xl text-accent">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        id="catalog-filters"
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <FilterGroup title="Genre">
            {genreOptions.map((genre) => (
              <FilterOption
                key={genre}
                id={`genre-${genre}`}
                label={genre}
                checked={filters.genres.includes(genre)}
                onToggle={() =>
                  onChange({ ...filters, genres: toggleString(filters.genres, genre) })
                }
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Pace">
            {paceOptions.map((pace) => (
              <FilterOption
                key={pace.value}
                id={`pace-${pace.value}`}
                label={pace.label}
                colorToken={pace.colorToken}
                checked={filters.pace.includes(pace.value)}
                onToggle={() =>
                  onChange({ ...filters, pace: togglePace(filters.pace, pace.value) })
                }
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Mood">
            {moodOptions.map((mood) => (
              <FilterOption
                key={mood.value}
                id={`mood-${mood.value}`}
                label={mood.label}
                colorToken={mood.colorToken}
                checked={filters.moods.includes(mood.value)}
                onToggle={() =>
                  onChange({ ...filters, moods: toggleMood(filters.moods, mood.value) })
                }
              />
            ))}
          </FilterGroup>
          <button
            type="button"
            className="mt-3 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white"
            onClick={() => onChange({ genres: [], moods: [], pace: [] })}
          >
            Clear filters
          </button>
        </div>
      </div>
    </aside>
  );
}

interface FilterGroupProps {
  title: string;
  children: ReactElement | ReactElement[];
}

function FilterGroup({ title, children }: FilterGroupProps): ReactElement {
  return (
    <section className="border-t border-secondary-gray/40 py-4" aria-label={title}>
      <h3 className="mb-2 text-xs font-bold uppercase text-primary-white">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export default FilterSidebar;
