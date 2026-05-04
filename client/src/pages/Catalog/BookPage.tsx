import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { ErrorState } from "../../components/ErrorState";
import {
  BookHero,
  BookPageSkeleton,
  ReviewForm,
  ReviewsSection,
} from "../../features/catalog/components/BookPageSections";
import { useBookActions } from "../../features/catalog/hooks/useBookActions";
import { useBookPageData } from "../../features/catalog/hooks/useBookPageData";
import type { BookRouteParams } from "../../routes";

export default function BookPage(): ReactElement {
  const { id } = useParams<BookRouteParams>();
  const [listId, setListId] = useState<number | null>(null);
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
  } = useBookPageData(id);
  const bookActions = useBookActions({
    id,
    listId,
    rating,
    reviewText,
    onReviewSubmitted: () => {
      setReviewText("");
      setRating(0);
    },
  });

  useEffect(() => {
    const firstCollection = collections?.[0];
    if (firstCollection) {
      setListId(firstCollection.list_id);
    }
  }, [collections]);

  const handleSubmitReview = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!reviewText.trim() || !rating) {
      toast.error("Add a rating and review before submitting.");
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
        canAddToList={Boolean(listId)}
        onAddBook={bookActions.addBook}
        onToggleDescription={() => setIsDescriptionExpanded((current) => !current)}
        onCoverError={() => setCoverFailed(true)}
      />
      <ReviewForm
        rating={rating}
        reviewText={reviewText}
        isSubmitting={bookActions.isSubmittingReview}
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
    </div>
  );
}
