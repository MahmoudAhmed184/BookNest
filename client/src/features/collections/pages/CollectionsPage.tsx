import { useMemo, useState, type ReactElement } from "react";

import { EmptyState, ErrorState } from "../../../components/ui";
import { routePaths } from "../../../routes/paths";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  CollectionCreatePanel,
  CollectionFilters,
  CollectionGrid,
  CollectionStats,
  CollectionsSkeleton,
} from "../components/CollectionsPageSections";
import { useCollections } from "../hooks/useCollections";
import type { ReadingCollection } from "../types/collection";
import {
  collectionPrivacyLabel,
  collectionTypeLabel,
  formatBookCount,
  getCollectionBookCount,
  getCollectionStats,
  getCollectionTimestamp,
  type CollectionPrivacyFilter,
  type CollectionSortOption,
  type CollectionTypeFilter,
} from "../utils/collectionPresentation";

function collectionSearchText(collection: ReadingCollection): string {
  return [
    collection.name,
    collection.description ?? "",
    collectionTypeLabel(collection.list_type ?? "custom"),
    collectionPrivacyLabel(collection.privacy ?? "private"),
    formatBookCount(getCollectionBookCount(collection)),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

function sortCollections(
  collections: ReadingCollection[],
  sortBy: CollectionSortOption
): ReadingCollection[] {
  return [...collections].sort((left, right) => {
    if (sortBy === "name") {
      return left.name.localeCompare(right.name);
    }

    if (sortBy === "books") {
      return (
        getCollectionBookCount(right) - getCollectionBookCount(left) ||
        left.name.localeCompare(right.name)
      );
    }

    return (
      getCollectionTimestamp(right) - getCollectionTimestamp(left) ||
      left.name.localeCompare(right.name)
    );
  });
}

export default function CollectionsPage(): ReactElement {
  const { token } = useAuth();
  const {
    collections,
    isLoading,
    isFetching,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useCollections(token);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<CollectionTypeFilter>("all");
  const [privacyFilter, setPrivacyFilter] =
    useState<CollectionPrivacyFilter>("all");
  const [sortBy, setSortBy] = useState<CollectionSortOption>("recent");
  const stats = useMemo(() => getCollectionStats(collections), [collections]);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredCollections = useMemo(() => {
    const visibleCollections = collections.filter((collection) => {
      const type = collection.list_type ?? "custom";
      const privacy = collection.privacy ?? "private";
      const matchesType = typeFilter === "all" || type === typeFilter;
      const matchesPrivacy =
        privacyFilter === "all" || privacy === privacyFilter;
      const matchesSearch =
        !normalizedSearch ||
        collectionSearchText(collection).includes(normalizedSearch);

      return matchesType && matchesPrivacy && matchesSearch;
    });

    return sortCollections(visibleCollections, sortBy);
  }, [collections, normalizedSearch, privacyFilter, sortBy, typeFilter]);
  const hasActiveFilters =
    normalizedSearch.length > 0 ||
    typeFilter !== "all" ||
    privacyFilter !== "all" ||
    sortBy !== "recent";

  const resetFilters = (): void => {
    setSearchTerm("");
    setTypeFilter("all");
    setPrivacyFilter("all");
    setSortBy("recent");
  };

  if (isLoading) {
    return <CollectionsSkeleton />;
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Collections could not be loaded"
          message="We could not load your reading collections right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 py-8 animate-fade-up lg:py-12">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-accent">
              Reading shelves
            </p>
            <h1 className="mt-3 display-heading">Collections</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-primary-gray">
              Organize books into focused shelves, keep private plans separate
              from public lists, and track what is moving through your library.
            </p>
          </div>
          <CollectionStats stats={stats} />
        </div>

        <CollectionCreatePanel
          isCreating={isCreating}
          onCreate={createCollection}
        />
      </header>

      {collections.length ? (
        <CollectionFilters
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          privacyFilter={privacyFilter}
          sortBy={sortBy}
          visibleCount={filteredCollections.length}
          totalCount={collections.length}
          isFetching={isFetching}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onPrivacyFilterChange={setPrivacyFilter}
          onSortChange={setSortBy}
          onResetFilters={resetFilters}
        />
      ) : null}

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Create a reading collection to start organizing books."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : filteredCollections.length === 0 ? (
        <EmptyState
          title="No matching collections"
          description="Adjust the search or filters to bring collections back into view."
          actionLabel="Reset filters"
          onAction={resetFilters}
        />
      ) : (
        <CollectionGrid
          collections={filteredCollections}
          isSaving={isUpdating}
          isDeleting={isDeleting}
          onUpdate={updateCollection}
          onDelete={deleteCollection}
        />
      )}
    </div>
  );
}
