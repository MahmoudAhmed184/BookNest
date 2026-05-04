import { useState, type FormEvent, type ReactElement } from "react";
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
  type: "todo" | "doing" | "done"
): ReadingList | undefined {
  return collections?.find((collection) => collection.type === type);
}

export default function BookPage(): ReactElement {
  const { id } = useParams<BookRouteParams>();
  const { token } = useOptionalAuth();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const {
    collections,
    book,
    reviews,
    ratings,
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
  const libraryList = findReadingListByType(collections, "todo")
    ?? collections?.find((collection) => collection.type !== "done")
    ?? collections?.[0];
  const completedList = findReadingListByType(collections, "done");
  const bookActions = useBookActions({
    id,
    libraryListId: libraryList?.list_id ?? null,
    completedListId: completedList?.list_id ?? null,
    rating,
    reviewText,
    token,
    onReviewSubmitted: () => {
      setReviewText("");
      setRating(0);
    },
  });

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
        canAddToList={Boolean(libraryList)}
        canMarkAsRead={Boolean(completedList)}
        onAddBook={bookActions.addBook}
        onMarkAsRead={bookActions.markAsRead}
        onToggleDescription={() => setIsDescriptionExpanded((current) => !current)}
        onCoverError={() => setCoverFailed(true)}
      />
      <ReviewForm
        rating={rating}
        reviewText={reviewText}
        isSubmitting={bookActions.isSubmittingReview}
        submitLabel={reviewText.trim() ? "Submit Review" : "Save Rating"}
        onRatingChange={setRating}
        onReviewTextChange={setReviewText}
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
    </div>
  );
}
