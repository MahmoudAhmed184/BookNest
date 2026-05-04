import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { categoryDirectory } from "../../features/catalog/data/exploreData";
import { routeBuilders, routePaths } from "../../routes";

export default function Categories(): ReactElement {
  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Browse Categories
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          Pick a genre to jump into a focused search shelf.
        </p>
      </header>

      {categoryDirectory.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Discovery categories will appear here when they are available."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : (
        <div className="flex flex-wrap gap-3" aria-label="Book categories">
          {categoryDirectory.map((category) => (
            <Link
              key={category.id}
              to={routeBuilders.searchQuery(category.title)}
              title={`Browse ${category.title} books`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-secondary-black px-4 py-2 text-center text-sm font-medium text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-secondary-gray hover:shadow-lg focus-visible:outline-accent"
            >
              {category.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
