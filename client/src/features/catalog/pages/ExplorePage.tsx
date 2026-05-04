import type { ReactElement } from "react";

import {
  ExploreBooksSection,
  GenreCarousel,
  PopularBooksGrid,
  RecommendationsSection,
} from "../components/ExploreSections";
import {
  exploreCategories,
  popularBooks,
} from "../data/exploreData";
import { useExploreCatalog } from "../hooks/useExploreCatalog";

export default function Explore(): ReactElement {
  const {
    books,
    recommendations,
    isBooksLoading,
    isBooksFetching,
    isBooksError,
    isRecommendationsLoading,
    isRecommendationsFetching,
    isRecommendationsError,
    refetchBooks,
    refetchRecommendations,
  } = useExploreCatalog();

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Explore
        </h1>
        <p className="max-w-2xl text-sm text-primary-gray leading-relaxed">
          Browse new paths into BookNest, from popular genres to books readers
          are discovering right now.
        </p>
      </header>

      <GenreCarousel categories={exploreCategories} />
      <RecommendationsSection
        recommendations={recommendations}
        isLoading={isRecommendationsLoading}
        isFetching={isRecommendationsFetching}
        isError={isRecommendationsError}
        onRetry={refetchRecommendations}
      />
      <ExploreBooksSection
        books={books}
        isLoading={isBooksLoading}
        isFetching={isBooksFetching}
        isError={isBooksError}
        onRetry={refetchBooks}
      />
      <PopularBooksGrid books={popularBooks} />
    </div>
  );
}
