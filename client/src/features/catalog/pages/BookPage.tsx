import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { ErrorState } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
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
import type { ReadingList } from "../../collections/types/collection";

function findReadingListByType(
  collections: ReadingList[] | undefined,
  type: "done"
): ReadingList | undefined {
  return collections?.find((collection) => collection.type === type);
}

export default function BookPage(): ReactElement {
  const { id } = useParams<BookRouteParams>();
  const { token } = useOptionalAuth();
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
    userRating,
    isBookLoading,
    isBookFetching,
    isBookError,
    isReviewsLoading,
    isReviewsFetching,
    isReviewsError,
    isRatingsError,
    refetchBook,
    refetchReviews,
    refetchRatings,
  } = useBookPageData(id, token);
  const completedList = findReadingListByType(collections, "done");
  const bookActions = useBookActions({
    id,
    completedListId: completedList?.list_id ?? null,
    currentRatingId: userRating?.rate_id,
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
    setRating(userRating?.rate ?? 0);
  }, [userRating?.rate, id]);

  const handleSubmitReview = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const hasReviewText = Boolean(reviewText.trim());

    if (!rating) {
      toast.error("Choose a rating before submitting.");
      return;
    }

    if (!hasReviewText) {
      bookActions.submitRating();
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
    <div className="py-12 flex flex-col gap-12 animate-fade-up">
      <BookHero
        book={book}
        isDescriptionExpanded={isDescriptionExpanded}
        coverFailed={coverFailed}
        isAddPending={bookActions.isAddingBook}
        isMarkReadPending={bookActions.isMarkingAsRead}
        canAddToList={Boolean(collections?.length)}
        canMarkAsRead={Boolean(completedList)}
        onAddBook={() => setIsListDialogOpen(true)}
        onMarkAsRead={bookActions.markAsRead}
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
        isLoading={isReviewsLoading}
        isFetching={isReviewsFetching}
        isError={isReviewsError}
        isRatingsError={isRatingsError}
        onRetry={() => {
          refetchReviews();
          refetchRatings();
        }}
      />
      <RelatedBooksCarousel currentBookId={book.isbn13} />
      <AddToListDialog
        open={isListDialogOpen}
        collections={collections ?? []}
        isPending={bookActions.isAddingBook}
        onClose={() => setIsListDialogOpen(false)}
        onSelect={(listId) => {
          bookActions.addBookToList(listId);
          setIsListDialogOpen(false);
        }}
      />
    </div>
  );
}

interface AddToListDialogProps {
  open: boolean;
  collections: ReadingList[];
  isPending: boolean;
  onClose: () => void;
  onSelect: (listId: number) => void;
}

function AddToListDialog({
  open,
  collections,
  isPending,
  onClose,
  onSelect,
}: AddToListDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="glass-card w-[min(92vw,520px)] border-none p-0 text-primary-white backdrop:bg-primary-black/80"
      aria-labelledby="add-to-list-title"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-to-list-title" className="text-xl font-bold">
              Choose a list
            </h2>
            <p className="mt-1 text-sm text-primary-gray">
              Save this book to one of your collections.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-primary-gray hover:bg-primary-black hover:text-primary-white"
            aria-label="Close list selector"
            onClick={onClose}
          >
            X
          </button>
        </div>
        <div className="grid gap-2">
          {collections.map((collection) => (
            <button
              key={collection.list_id}
              type="button"
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-[var(--surface-glass-border)] px-4 py-3 text-left hover:bg-primary-black"
              disabled={isPending}
              onClick={() => onSelect(collection.list_id)}
            >
              <span>
                <span className="block font-semibold text-primary-white">
                  {collection.name}
                </span>
                <span className="text-xs text-primary-gray">
                  {collection.type ?? "custom"} / {collection.privacy ?? "private"}
                </span>
              </span>
              <span className="text-sm font-semibold text-accent">
                {collection.book_count ?? collection.books?.length ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
