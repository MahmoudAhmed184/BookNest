import { useMemo, useState, type ReactElement } from "react";

import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  ExploreBooksSection,
  GenreCarousel,
  PopularBooksGrid,
  RecommendationsSection,
} from "../components/ExploreSections";
import { FilterSidebar } from "../components/FilterSidebar";
import { useExploreCatalog } from "../hooks/useExploreCatalog";
import type { CatalogFilters } from "../types/filters";
import { filterBooksByCatalogFilters } from "../utils/bookFacets";

const initialFilters: CatalogFilters = {
  genres: [],
  moods: [],
  pace: [],
};

export default function Explore(): ReactElement {
  const { token } = useOptionalAuth();
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const {
    books,
    categories = [],
    popularBooks = [],
    recommendations,
    isBooksLoading,
    isBooksFetching,
    isBooksError,
    isRecommendationsLoading,
    isRecommendationsFetching,
    isRecommendationsError,
    refetchBooks,
    refetchRecommendations,
  } = useExploreCatalog(token);
  const filteredBooks = useMemo(
    () => filterBooksByCatalogFilters(books, filters),
    [books, filters]
  );
  const genreOptions = useMemo(
    () => categories.slice(0, 10).map((category) => category.name),
    [categories]
  );

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading">
          Explore
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
          Browse new paths into BookNest, from popular genres to books readers
          are discovering right now.
        </p>
      </header>

      <GenreCarousel categories={categories.slice(0, 10)} />
      <RecommendationsSection
        recommendations={recommendations}
        isLoading={isRecommendationsLoading}
        isFetching={isRecommendationsFetching}
        isError={isRecommendationsError}
        onRetry={refetchRecommendations}
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          filters={filters}
          genreOptions={genreOptions}
          resultCount={filteredBooks.length}
          onChange={setFilters}
        />
        <ExploreBooksSection
          books={filteredBooks}
          isLoading={isBooksLoading}
          isFetching={isBooksFetching}
          isError={isBooksError}
          onRetry={refetchBooks}
        />
      </div>
      {popularBooks.length > 0 ? <PopularBooksGrid books={popularBooks} /> : null}
    </div>
  );
}
