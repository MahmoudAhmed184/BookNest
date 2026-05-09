import type { ReactElement } from "react";

import { EmptyState } from "../../../../components/ui";
import { routePaths } from "../../../../routes/paths";
import type {
  CollectionBook,
  ReadingCollection,
} from "../../../collections/types/collection";
import { BookShelfCarousel } from "./BookShelfCarousel";

export interface ProfileBooksSectionProps {
  title: string;
  items: CollectionBook[];
  primaryCollection?: ReadingCollection | undefined;
  isFetching: boolean;
  emptyTitle: string;
  emptyDescription: string;
  canDelete?: boolean | undefined;
  isDeleting?: boolean | undefined;
  onDeleteBook?: ((item: CollectionBook) => void) | undefined;
}

export function ProfileBooksSection({
  title,
  items,
  primaryCollection,
  isFetching,
  emptyTitle,
  emptyDescription,
  canDelete = false,
  isDeleting = false,
  onDeleteBook,
}: ProfileBooksSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="profile-books-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Shelf picks</p>
          <h2 id="profile-books-title" className="text-2xl font-bold text-primary-white">
            {title}
          </h2>
        </div>
        {isFetching && items.length > 0 ? (
          <p className="rounded-lg border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray" role="status">
            Updating shelf...
          </p>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : (
        <BookShelfCarousel
          items={items}
          primaryCollection={primaryCollection}
          canDelete={canDelete}
          isDeleting={isDeleting}
          onDeleteBook={onDeleteBook}
        />
      )}
    </section>
  );
}
