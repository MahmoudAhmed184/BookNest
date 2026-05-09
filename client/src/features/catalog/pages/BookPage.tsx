import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { ErrorState, InlineSpinner } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  addToCollection,
  createCollection,
  getCollectionBooks,
  getCollections,
  removeFromCollection,
} from "../../collections/services/collectionService";
import { collectionKeys } from "../../collections/hooks/collection.keys";
import {
  BookHero,
  BookPageSkeleton,
  RelatedBooksCarousel,
  ReviewForm,
  ReviewsSection,
} from "../components/BookPageSections";
import { useBookActions } from "../hooks/useBookActions";
import { useBookPageData } from "../hooks/useBookPageData";
import type { BookRouteParams } from "../../../routes/paths";
import { profileKeys } from "../../profile/hooks/profile.keys";
import type {
  CollectionBook,
  ReadingCollection,
} from "../../collections/types/collection";
import type { ReviewSortBy, ReviewSortOrder } from "../types/book";

function findCollectionByStatus(
  collections: ReadingCollection[] | undefined,
  type: "done"
): ReadingCollection | undefined {
  return collections?.find((collection) => collection.list_type === type);
}

export default function BookPage(): ReactElement {
  const { id } = useParams<BookRouteParams>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, authUser } = useOptionalAuth();
  const sortBy = parseReviewSortBy(searchParams.get("sort_by"));
  const order = parseReviewSortOrder(searchParams.get("order"));
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const {
    collections,
    book,
    reviews,
    ratings,
    reviewVotes,
    userRating,
    isBookLoading,
    isBookFetching,
    isBookError,
    isReviewsLoading,
    isReviewsFetching,
    isReviewsError,
    isRatingsError,
    isReviewVotesError,
    refetchBook,
    refetchReviews,
    refetchRatings,
  } = useBookPageData(id, token, { sortBy, order });
  const completedList = findCollectionByStatus(collections, "done");
  const bookActions = useBookActions({
    id,
    completedListId: completedList?.id ?? null,
    currentRatingId: userRating?.id,
    rating,
    reviewText,
    token,
    onRatingDeleted: () => {
      setRating(0);
    },
    onReviewSubmitted: () => {
      setReviewText("");
    },
  });

  useEffect(() => {
    setRating(userRating?.value ?? 0);
  }, [userRating?.value, id]);

  const handleSubmitReview = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const hasReviewText = Boolean(reviewText.trim());

    if (!rating) {
      toast.error("Choose a rating before submitting.");
      return;
    }

    if (!hasReviewText) {
      bookActions.submitRating(rating);
      return;
    }

    bookActions.submitReview();
  };

  if (isBookLoading) return <BookPageSkeleton />;

  if (isBookError || !book) {
    return (
      <div className="py-12">
        <ErrorState
          title="Book details are unavailable"
          message="We could not load this book right now."
          onRetry={refetchBook}
          isRetrying={isBookFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-16 animate-fade-up">
      <BookHero
        book={book}
        isDescriptionExpanded={isDescriptionExpanded}
        coverFailed={coverFailed}
        isAddPending={bookActions.isAddingBook}
        isMarkReadPending={bookActions.isMarkingAsRead}
        isSavingRating={bookActions.isSavingRating}
        canAddToList
        canMarkAsRead
        rating={rating}
        listPopover={
          isListDialogOpen ? (
            <AddToListDialog
              open={isListDialogOpen}
              bookId={book.id}
              initialCollections={collections ?? []}
              token={token}
              onClose={() => setIsListDialogOpen(false)}
            />
          ) : null
        }
        onAddBook={() => {
          if (!token) {
            toast.error("Sign in to save books to a list.");
            return;
          }

          setIsListDialogOpen((current) => !current);
        }}
        onMarkAsRead={bookActions.markAsRead}
        onRateBook={(nextRating) => {
          if (!token) {
            bookActions.submitRating(nextRating);
            return;
          }

          setRating(nextRating);
          bookActions.submitRating(nextRating);
        }}
        onToggleDescription={() => setIsDescriptionExpanded((current) => !current)}
        onCoverError={() => setCoverFailed(true)}
      />
      <ReviewForm
        rating={rating}
        reviewText={reviewText}
        isSubmitting={bookActions.isSubmittingReview}
        isDeletingRating={bookActions.isDeletingRating}
        canDeleteRating={Boolean(userRating)}
        submitLabel={
          reviewText.trim()
            ? "Submit Review"
            : userRating
              ? "Update Rating"
              : "Save Rating"
        }
        onRatingChange={setRating}
        onReviewTextChange={setReviewText}
        onDeleteRating={bookActions.deleteRating}
        onSubmit={handleSubmitReview}
      />
      <ReviewsSection
        reviews={reviews}
        ratings={ratings}
        reviewVotes={reviewVotes}
        isLoading={isReviewsLoading}
        isFetching={isReviewsFetching}
        isError={isReviewsError}
        isRatingsError={isRatingsError || isReviewVotesError}
        sortBy={sortBy}
        order={order}
        currentUserId={authUser?.id ?? null}
        isUpdatingReview={bookActions.isUpdatingReview}
        isVotingReview={bookActions.isVotingReview}
        onSortChange={(nextSortBy, nextOrder) => {
          const params = new URLSearchParams(searchParams);
          params.set("sort_by", nextSortBy);
          params.set("order", nextOrder);
          setSearchParams(params, { replace: true });
        }}
        onUpdateReview={bookActions.editReview}
        onVoteReview={bookActions.voteReview}
        onDeleteReviewVote={bookActions.deleteReviewVote}
        onRetry={() => {
          refetchReviews();
          refetchRatings();
        }}
      />
      <RelatedBooksCarousel currentBookId={book.id} />
    </div>
  );
}

function parseReviewSortBy(value: string | null): ReviewSortBy {
  return value === "upvote_count" ? "upvote_count" : "reviewed_at";
}

function parseReviewSortOrder(value: string | null): ReviewSortOrder {
  return value === "asc" ? "asc" : "desc";
}

interface AddToListDialogProps {
  open: boolean;
  bookId: number;
  initialCollections: ReadingCollection[];
  token?: string | null | undefined;
  onClose: () => void;
}

function AddToListDialog({
  open,
  bookId,
  initialCollections,
  token,
  onClose,
}: AddToListDialogProps): ReactElement | null {
  const queryClient = useQueryClient();
  const [newListName, setNewListName] = useState("");
  const [optimisticAddedCollectionIds, setOptimisticAddedCollectionIds] =
    useState<Set<number>>(new Set());
  const [optimisticRemovedItemIds, setOptimisticRemovedItemIds] =
    useState<Set<number>>(new Set());

  const collectionsQuery = useQuery({
    queryKey: profileKeys.collections(),
    queryFn: () => getCollections(token),
    enabled: open && Boolean(token),
  });
  const collectionBooksQuery = useQuery({
    queryKey: collectionKeys.items(),
    queryFn: () => getCollectionBooks(token),
    enabled: open && Boolean(token),
  });
  const collections = collectionsQuery.data ?? initialCollections;
  const fallbackCollectionBooks = useMemo(
    () => collectionItemsFromCollections(collections),
    [collections]
  );
  const collectionBooks = collectionBooksQuery.data ?? fallbackCollectionBooks;

  const updateCachedCollection = (
    collectionId: number,
    updater: (collection: ReadingCollection) => ReadingCollection
  ): void => {
    const updateList = (
      current: ReadingCollection[] | undefined
    ): ReadingCollection[] | undefined =>
      current?.map((collection) =>
        collection.id === collectionId ? updater(collection) : collection
      );

    queryClient.setQueryData<ReadingCollection[]>(
      profileKeys.collections(),
      updateList
    );
    queryClient.setQueryData<ReadingCollection[]>(
      collectionKeys.list(),
      updateList
    );
  };

  const addMutation = useMutation({
    mutationFn: (collection: ReadingCollection) =>
      addToCollection(
        {
          collection: collection.id,
          book: bookId,
          status: collection.list_type,
        },
        token
      ),
    onSuccess: (collectionBook, collection) => {
      queryClient.setQueryData<CollectionBook[]>(
        collectionKeys.items(),
        (current = []) => [
          ...current.filter(
            (item) =>
              !(item.collection === collection.id && item.book === bookId)
          ),
          collectionBook,
        ]
      );
      updateCachedCollection(collection.id, (cachedCollection) => {
        const activeItems = cachedCollection.items?.filter(
          (item) => !item.is_archived
        );
        const baseCount = cachedCollection.item_count ?? activeItems?.length ?? 0;
        const alreadyCounted = Boolean(
          activeItems?.some((item) => item.book === bookId)
        );

        return {
          ...cachedCollection,
          item_count: alreadyCounted ? baseCount : baseCount + 1,
          items: cachedCollection.items
            ? [
                ...cachedCollection.items.filter(
                  (item) =>
                    !(item.collection === collection.id && item.book === bookId)
                ),
                collectionBook,
              ]
            : cachedCollection.items,
        };
      });
      setOptimisticAddedCollectionIds((current) => {
        const next = new Set(current);
        next.delete(collection.id);
        return next;
      });
      toast.success("Added to your list.");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.items() });
    },
    onError: () => {
      toast.error("Couldn't save. Try again.");
      setOptimisticAddedCollectionIds(new Set());
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (collectionBook: CollectionBook) => {
      await removeFromCollection(collectionBook.id, token);
      return collectionBook;
    },
    onSuccess: (collectionBook) => {
      queryClient.setQueryData<CollectionBook[]>(
        collectionKeys.items(),
        (current = []) => current.filter((item) => item.id !== collectionBook.id)
      );
      updateCachedCollection(collectionBook.collection, (cachedCollection) => {
        const activeItems = cachedCollection.items?.filter(
          (item) => !item.is_archived
        );
        const baseCount = cachedCollection.item_count ?? activeItems?.length ?? 0;
        const wasCounted =
          activeItems === undefined ||
          activeItems.some((item) => item.id === collectionBook.id);

        return {
          ...cachedCollection,
          item_count: wasCounted ? Math.max(0, baseCount - 1) : baseCount,
          items: cachedCollection.items?.map((item) =>
            item.id === collectionBook.id ? { ...item, is_archived: true } : item
          ),
        };
      });
      setOptimisticRemovedItemIds((current) => {
        const next = new Set(current);
        next.delete(collectionBook.id);
        return next;
      });
      toast.success("Removed from list.");
      queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
      queryClient.invalidateQueries({ queryKey: collectionKeys.items() });
    },
    onError: () => {
      toast.error("Couldn't remove this book. Try again.");
      setOptimisticRemovedItemIds(new Set());
    },
  });

  const createListMutation = useMutation({
    mutationFn: (name: string) =>
      createCollection(
        {
          name,
          list_type: "custom",
          privacy: "private",
        },
        token
      ),
    onSuccess: async (collection) => {
      setNewListName("");
      setOptimisticAddedCollectionIds((current) => new Set(current).add(collection.id));
      await addMutation.mutateAsync(collection);
      await queryClient.invalidateQueries({ queryKey: profileKeys.collections() });
      await queryClient.invalidateQueries({ queryKey: collectionKeys.items() });
    },
    onError: () => {
      toast.error("Couldn't create the list. Try again.");
    },
  });

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setNewListName("");
      setOptimisticAddedCollectionIds(new Set());
      setOptimisticRemovedItemIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    setOptimisticAddedCollectionIds((current) => {
      const next = new Set<number>();
      current.forEach((collectionId) => {
        const activeItem = collectionBooks.find(
          (item) =>
            item.collection === collectionId &&
            item.book === bookId &&
            !item.is_archived
        );
        if (!activeItem) next.add(collectionId);
      });
      return next;
    });

    setOptimisticRemovedItemIds((current) => {
      const next = new Set<number>();
      current.forEach((itemId) => {
        const stillPresent = collectionBooks.some(
          (item) => item.id === itemId && !item.is_archived
        );
        if (stillPresent) next.add(itemId);
      });
      return next;
    });
  }, [bookId, collectionBooks]);

  const handleCreateList = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    createListMutation.mutate(name);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onMouseDown={onClose} />
      <section
        role="dialog"
        aria-labelledby="add-to-list-title"
        className="fixed inset-x-4 bottom-4 z-50 max-h-[min(78vh,430px)] overflow-hidden rounded-xl border border-[var(--surface-glass-border)] bg-secondary-black/95 text-primary-white shadow-lg backdrop-blur-md sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[360px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-[min(78vh,430px)] flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="add-to-list-title"
              className="font-display text-2xl font-bold leading-tight"
            >
              Add to list
            </h2>
            <button
              type="button"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-primary-white hover:bg-primary-white/10"
              aria-label="Close list selector"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="mt-5 max-h-[250px] overflow-y-auto pr-1">
            {collectionsQuery.isLoading && !initialCollections.length ? (
              <div className="grid gap-3" role="status" aria-live="polite">
                <div className="h-14 rounded-lg animate-shimmer" />
                <div className="h-14 rounded-lg animate-shimmer" />
                <div className="h-14 rounded-lg animate-shimmer" />
              </div>
            ) : collections.length ? (
              <div className="grid gap-1">
                {collections.map((collection) => {
                  const activeCollectionBook = collectionBooks.find(
                    (item) =>
                      item.collection === collection.id &&
                      item.book === bookId &&
                      !item.is_archived
                  );
                  const isOptimisticallyRemoved = activeCollectionBook
                    ? optimisticRemovedItemIds.has(activeCollectionBook.id)
                    : false;
                  const isOptimisticallyAdded = optimisticAddedCollectionIds.has(
                    collection.id
                  );
                  const isSelected = Boolean(
                    (activeCollectionBook && !isOptimisticallyRemoved) ||
                      isOptimisticallyAdded
                  );
                  const baseBookCount =
                    collection.item_count ??
                    collectionBooks.filter(
                      (item) => item.collection === collection.id && !item.is_archived
                    ).length;
                  const bookCount = Math.max(
                    0,
                    baseBookCount +
                      (isOptimisticallyAdded && !activeCollectionBook ? 1 : 0) -
                      (activeCollectionBook && isOptimisticallyRemoved ? 1 : 0)
                  );

                  return (
                    <button
                      key={collection.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      className="flex min-h-[68px] items-center justify-between gap-5 rounded-lg px-3 py-2 text-left hover:bg-primary-white/5 disabled:cursor-wait disabled:opacity-75"
                      disabled={addMutation.isPending || removeMutation.isPending}
                      onClick={() => {
                        if (activeCollectionBook && !isOptimisticallyRemoved) {
                          setOptimisticRemovedItemIds((current) =>
                            new Set(current).add(activeCollectionBook.id)
                          );
                          setOptimisticAddedCollectionIds((current) => {
                            const next = new Set(current);
                            next.delete(collection.id);
                            return next;
                          });
                          removeMutation.mutate(activeCollectionBook, {
                            onError: () => {
                              setOptimisticRemovedItemIds((current) => {
                                const next = new Set(current);
                                next.delete(activeCollectionBook.id);
                                return next;
                              });
                            },
                          });
                          return;
                        }

                        setOptimisticAddedCollectionIds((current) =>
                          new Set(current).add(collection.id)
                        );
                        addMutation.mutate(collection, {
                          onError: () => {
                            setOptimisticAddedCollectionIds((current) => {
                              const next = new Set(current);
                              next.delete(collection.id);
                              return next;
                            });
                            queryClient.invalidateQueries({
                              queryKey: collectionKeys.items(),
                            });
                          },
                        });
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-bold text-primary-white">
                          {collection.name}
                        </span>
                        <span className="mt-1 block text-sm text-primary-gray">
                          {bookCount} {bookCount === 1 ? "book" : "books"}
                        </span>
                      </span>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-[var(--surface-glass-border)] text-accent">
                        {isSelected ? <CheckIcon /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-[var(--surface-glass-border)] px-4 py-5 text-sm text-primary-gray">
                No lists yet. Create one below to save this book.
              </p>
            )}
          </div>
          <form
            className="mt-5 flex gap-2 border-t border-[var(--surface-glass-border)] pt-4"
            onSubmit={handleCreateList}
          >
            <label htmlFor="new-list-name" className="sr-only">
              New list name
            </label>
            <input
              id="new-list-name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              className="field min-h-[54px] min-w-0 flex-1 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/25 text-lg text-primary-white placeholder:text-primary-gray"
              placeholder="New list"
              disabled={createListMutation.isPending}
            />
            <button
              type="submit"
              className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              aria-label="Create new list"
              disabled={createListMutation.isPending || !newListName.trim()}
            >
              {createListMutation.isPending ? <InlineSpinner /> : <PlusIcon />}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function collectionItemsFromCollections(collections: ReadingCollection[]): CollectionBook[] {
  return collections.flatMap((collection) => collection.items ?? []);
}

function CloseIcon(): ReactElement {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon(): ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4.5 10 3.5 3.5L15.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(): ReactElement {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
