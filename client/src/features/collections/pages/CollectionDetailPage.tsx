import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import {
  BookCard,
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  InlineSpinner,
} from "../../../components/ui";
import {
  routeBuilders,
  routePaths,
  type CollectionRouteParams,
} from "../../../routes/paths";
import { useAuth } from "../../auth/hooks/useAuth";
import { getAuthorNames } from "../../catalog/utils/bookFacets";
import { useCollectionDetail } from "../hooks/useCollections";

const skeletonKeys = ["collection-book-1", "collection-book-2", "collection-book-3"];

export default function CollectionDetailPage(): ReactElement {
  const { id } = useParams<CollectionRouteParams>();
  const { token } = useAuth();
  const {
    collection,
    isLoading,
    isFetching,
    isError,
    isRemovingBook,
    refetch,
    removeBook,
  } = useCollectionDetail(id, token);
  const books = collection?.books ?? [];

  if (isLoading) {
    return (
      <div className="py-12" role="status">
        <div className="mb-6 h-10 w-64 rounded-full animate-shimmer" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skeletonKeys.map((key) => (
            <BookCardSkeleton key={key} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !collection) {
    return (
      <div className="py-12">
        <ErrorState
          title="Collection could not be loaded"
          message="We could not load this reading list right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 animate-fade-up lg:py-12">
      <header className="flex max-w-[1120px] flex-col gap-3">
        <Link
          to={routePaths.collections}
          className="text-sm font-semibold text-accent hover:text-primary-white"
        >
          Collections
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-primary-white md:text-5xl">
              {collection.name}
            </h1>
            <p className="mt-2 text-sm text-primary-gray">
              {collection.type ?? "custom"} / {collection.privacy ?? "private"} /{" "}
              {collection.book_count ?? books.length} books
            </p>
          </div>
          <Link
            to={routeBuilders.collection(collection.list_id)}
            className="sr-only"
            aria-current="page"
          >
            Current collection
          </Link>
        </div>
      </header>

      {books.length === 0 ? (
        <EmptyState
          title="This collection is empty"
          description="Add books from a book detail page to fill this list."
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <div key={book.isbn13} className="relative">
              <BookCard
                to={routeBuilders.book(book.isbn13)}
                title={book.title}
                author={getAuthorNames(book)}
                coverSrc={book.cover_img ?? undefined}
                rating={book.average_rate}
              />
              <button
                type="button"
                className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black/90 text-sm font-bold text-accent shadow-md hover:text-primary-white"
                disabled={isRemovingBook}
                aria-label={`Remove ${book.title} from ${collection.name}`}
                onClick={() => void removeBook(book.isbn13)}
              >
                {isRemovingBook ? <InlineSpinner /> : "X"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
