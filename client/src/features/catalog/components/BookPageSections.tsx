import type { FormEvent, ReactElement } from "react";
import { Link } from "react-router-dom";

import {
  BookCardSkeleton,
  EmptyState,
  ErrorState,
  InlineSpinner,
} from "../../../components/ui";
import { routeBuilders, routePaths } from "../../../routes/paths";
import type { Book, BookRating, BookReview } from "../types/book";

export function getInitials(value?: string | null): string {
  if (!value) return "BN";
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BN"
  );
}

export function BookPageSkeleton(): ReactElement {
  return (
    <div className="py-12 animate-fade-up" role="status" aria-live="polite">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="w-full max-w-[320px]">
          <BookCardSkeleton showAuthor={false} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="h-10 w-3/4 rounded-full animate-shimmer" />
          <div className="h-5 w-1/2 rounded-full animate-shimmer" />
          <div className="flex gap-3">
            <div className="h-11 w-36 rounded-xl animate-shimmer" />
            <div className="h-11 w-36 rounded-xl animate-shimmer" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-xl animate-shimmer" />
            ))}
          </div>
          <div className="h-28 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface BookHeroProps {
  book: Book;
  isDescriptionExpanded: boolean;
  coverFailed: boolean;
  isAddPending: boolean;
  canAddToList: boolean;
  onAddBook: () => void;
  onToggleDescription: () => void;
  onCoverError: () => void;
}

export function BookHero({
  book,
  isDescriptionExpanded,
  coverFailed,
  isAddPending,
  canAddToList,
  onAddBook,
  onToggleDescription,
  onCoverError,
}: BookHeroProps): ReactElement {
  const authors =
    book.authors
      ?.map((author) => (typeof author === "string" ? author : author.name))
      .filter(Boolean)
      .join(", ") || book.author;
  const description = book.description || "No description available yet.";
  const shouldCollapseDescription = description.length > 280;
  const canShowCover = Boolean(book.cover_img) && !coverFailed;

  return (
    <section className="grid gap-8 lg:grid-cols-[320px_1fr]" aria-labelledby="book-title">
      <div className="mx-auto w-full max-w-[320px] lg:mx-0">
        <div className="overflow-hidden rounded-xl bg-secondary-black shadow-xl [will-change:transform]">
          {canShowCover ? (
            <img
              src={book.cover_img ?? undefined}
              alt={`Cover of ${book.title}`}
              className="aspect-[2/3] w-full object-cover"
              width="320"
              height="480"
              loading="eager"
              decoding="async"
              onError={onCoverError}
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center bg-secondary-gray px-8 text-center text-5xl font-semibold text-primary-white">
              <span aria-hidden="true">{getInitials(book.title)}</span>
              <span className="sr-only">Cover unavailable for {book.title}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <BookSummary book={book} authors={authors} />
        <BookActions
          isAddPending={isAddPending}
          canAddToList={canAddToList}
          onAddBook={onAddBook}
        />
        <BookMetadata book={book} />
        <BookDescription
          description={description}
          isExpanded={isDescriptionExpanded}
          shouldCollapse={shouldCollapseDescription}
          onToggle={onToggleDescription}
        />
      </div>
    </section>
  );
}

interface BookSummaryProps {
  book: Book;
  authors?: string | undefined;
}

function BookSummary({ book, authors }: BookSummaryProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h1 id="book-title" className="text-3xl font-semibold text-primary-white text-balance sm:text-4xl" title={book.title}>
        {book.title}
      </h1>
      {authors ? (
        <p className="text-lg text-primary-gray">
          by <span className="text-primary-white">{authors}</span>
        </p>
      ) : null}
      <p
        className="flex items-center gap-2 text-sm text-primary-gray"
        aria-label={`Average rating ${book.average_rate || 0} out of 5 from ${book.number_of_ratings || 0} ratings`}
      >
        <span className="text-accent" aria-hidden="true">★</span>
        {book.average_rate || 0} / 5.0 ({book.number_of_ratings || 0})
      </p>
      {book.genres?.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Book genres">
          {book.genres.map((genre) => (
            <span key={genre} className="rounded-full bg-secondary-black px-4 py-2 text-xs font-medium text-primary-gray">
              {genre}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface BookActionsProps {
  isAddPending: boolean;
  canAddToList: boolean;
  onAddBook: () => void;
}

function BookActions({
  isAddPending,
  canAddToList,
  onAddBook,
}: BookActionsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onAddBook}
        disabled={isAddPending || !canAddToList}
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        {isAddPending ? <InlineSpinner /> : null}
        Add to Library
      </button>
      <Link
        to={routePaths.myProfile}
        className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        Mark as Read
      </Link>
    </div>
  );
}

interface BookMetadataProps {
  book: Book;
}

function BookMetadata({ book }: BookMetadataProps): ReactElement {
  return (
    <dl className="grid gap-3 text-sm text-primary-gray sm:grid-cols-2">
      <div className="rounded-xl bg-secondary-black p-4">
        <dt className="text-primary-white">Release Date</dt>
        <dd>{book.publication_date || "Unknown"}</dd>
      </div>
      <div className="rounded-xl bg-secondary-black p-4">
        <dt className="text-primary-white">Pages</dt>
        <dd>{book.number_of_pages || "Unknown"}</dd>
      </div>
      <div className="rounded-xl bg-secondary-black p-4">
        <dt className="text-primary-white">Language</dt>
        <dd>{book.language || "Unknown"}</dd>
      </div>
      <div className="rounded-xl bg-secondary-black p-4">
        <dt className="text-primary-white">ISBN</dt>
        <dd>{book.isbn13}</dd>
      </div>
    </dl>
  );
}

interface BookDescriptionProps {
  description: string;
  isExpanded: boolean;
  shouldCollapse: boolean;
  onToggle: () => void;
}

function BookDescription({
  description,
  isExpanded,
  shouldCollapse,
  onToggle,
}: BookDescriptionProps): ReactElement {
  return (
    <section className="flex max-w-2xl flex-col gap-3" aria-labelledby="description-title">
      <h2 id="description-title" className="text-xl font-semibold text-primary-white">
        Description
      </h2>
      <p className={`text-base text-primary-white leading-relaxed ${shouldCollapse && !isExpanded ? "line-clamp-3" : ""}`}>
        {description}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={onToggle}
          className="self-start rounded-full px-3 py-2 text-sm font-medium text-accent hover:bg-secondary-black"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </section>
  );
}

interface ReviewFormProps {
  rating: number;
  reviewText: string;
  isSubmitting: boolean;
  onRatingChange: (rating: number) => void;
  onReviewTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ReviewForm({
  rating,
  reviewText,
  isSubmitting,
  onRatingChange,
  onReviewTextChange,
  onSubmit,
}: ReviewFormProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="review-form-title">
      <form onSubmit={onSubmit} className="bg-secondary-black p-4 rounded-xl flex flex-col gap-4 sm:p-6">
        <h2 id="review-form-title" className="text-xl font-semibold text-primary-white">
          Share your review
        </h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-primary-white">
            Your rating
          </legend>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Rate this book">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange(star)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-2xl hover:bg-primary-black"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                aria-pressed={rating === star}
              >
                <span className={rating >= star ? "text-accent font-bold" : "text-primary-gray"} aria-hidden="true">
                  ★
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="reviewText" className="text-sm font-medium text-primary-white">
            Review
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(event) => onReviewTextChange(event.target.value)}
            className="min-h-32 rounded-xl bg-primary-black p-3 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
            placeholder="Write your review here..."
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 py-2 text-primary-white"
        >
          {isSubmitting ? <InlineSpinner /> : null}
          Submit Review
        </button>
      </form>
    </section>
  );
}

interface ReviewsSectionProps {
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRatingsError: boolean;
  onRetry: () => void;
}

export function ReviewsSection({
  reviews,
  ratings,
  isLoading,
  isFetching,
  isError,
  isRatingsError,
  onRetry,
}: ReviewsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-xl font-semibold text-primary-white">
          Reader Reviews
        </h2>
        {isFetching && reviews?.length ? (
          <p className="text-xs text-primary-gray" role="status">
            Updating reviews...
          </p>
        ) : null}
      </div>
      {isLoading ? <ReviewsSkeleton /> : null}
      {isError || isRatingsError ? (
        <ErrorState
          title="Reviews could not be loaded"
          message="We could not load reader reviews right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Be the first reader to leave a thoughtful note about this book."
        />
      ) : null}
      {!isLoading && !isError && !isRatingsError
        ? reviews?.map((review, index) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              rating={ratings?.[index]?.rate ?? 0}
            />
          ))
        : null}
    </section>
  );
}

function ReviewsSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-xl bg-secondary-black p-4">
          <div className="mb-4 h-8 w-48 rounded-full animate-shimmer" />
          <div className="h-16 rounded-xl animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: BookReview;
  rating: number;
}

function ReviewCard({ review, rating }: ReviewCardProps): ReactElement {
  return (
    <article className="bg-secondary-black p-4 rounded-xl text-primary-white transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <ReviewAvatar review={review} />
          <strong>
            <Link to={routeBuilders.userProfile(review.profile_id)} className="hover:text-accent">
              {review.username || "Reader"}
            </Link>
          </strong>
        </div>
        <p className="flex gap-1 text-sm" aria-label={`Reader rating ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={rating >= star ? "text-accent font-bold" : "text-primary-gray"} aria-hidden="true">
              ★
            </span>
          ))}
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-primary-white">
        {review.review_text}
      </p>
      {review.created_at ? (
        <p className="mt-3 text-xs text-primary-gray">{review.created_at}</p>
      ) : null}
    </article>
  );
}

interface ReviewAvatarProps {
  review: BookReview;
}

function ReviewAvatar({ review }: ReviewAvatarProps): ReactElement {
  return (
    <Link
      to={routeBuilders.userProfile(review.profile_id)}
      className="h-11 w-11 overflow-hidden rounded-xl bg-primary-gray"
      aria-label={`View ${review.username || "reader"} profile`}
    >
      {review.profile_pic ? (
        <img
          src={
            review.profile_pic.endsWith("image")
              ? `${review.profile_pic}.svg`
              : review.profile_pic
          }
          className="h-full w-full object-cover"
          alt={`${review.username || "Reader"} avatar`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary-white">
          {getInitials(review.username)}
        </span>
      )}
    </Link>
  );
}
