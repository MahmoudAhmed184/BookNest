import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "../../../components/BookCard";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { InlineSpinner } from "../../../components/InlineSpinner";
import { routeBuilders, routePaths } from "../../../routes";
import type { Book, BookRating, BookReview } from "../../../types/book";
import type { ReadingList } from "../../../types/collection";
import type { UserProfile } from "../../../types/user";

export function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

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

export function ProfileSkeleton(): ReactElement {
  return (
    <div className="py-12 flex flex-col gap-10 animate-fade-up" role="status" aria-live="polite">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <div className="h-64 w-64 rounded-xl animate-shimmer" />
        <div className="flex grow flex-col gap-4">
          <div className="h-9 w-56 rounded-full animate-shimmer" />
          <div className="h-11 w-36 rounded-xl animate-shimmer" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl animate-shimmer" />
        ))}
      </div>
      <div className="h-28 rounded-xl animate-shimmer" />
    </div>
  );
}

interface ProfileHeaderProps {
  user: UserProfile;
  action: ReactElement;
  center?: boolean;
}

export function ProfileHeader({
  user,
  action,
  center = false,
}: ProfileHeaderProps): ReactElement {
  const profileImage = resolveProfileImage(user.profile_pic);

  return (
    <section className={`flex flex-col gap-6 md:flex-row md:items-end ${center ? "items-center" : ""}`}>
      <div className="w-64 aspect-square overflow-hidden rounded-xl bg-secondary-black shadow-xl">
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${user.username}'s profile image`}
            className="h-full w-full object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
            width="256"
            height="256"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-primary-white">
            {getInitials(user.username)}
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-4 ${center ? "items-center md:items-start" : ""}`}>
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          {user.username}
        </h1>
        {action}
      </div>
    </section>
  );
}

interface ReadingStatsProps {
  bookCount: number;
  reviewCount: number;
  ratingCount: number;
}

export function ReadingStats({
  bookCount,
  reviewCount,
  ratingCount,
}: ReadingStatsProps): ReactElement {
  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Reading stats">
      <StatCard value={bookCount} label="Books shelved" />
      <StatCard value={reviewCount} label="Reviews" />
      <StatCard value={ratingCount} label="Ratings" />
    </section>
  );
}

interface StatCardProps {
  value: number;
  label: string;
}

function StatCard({ value, label }: StatCardProps): ReactElement {
  return (
    <div className="rounded-xl bg-secondary-black p-5">
      <p className="text-3xl font-bold text-primary-white">{value}</p>
      <p className="text-xs uppercase text-primary-gray">{label}</p>
    </div>
  );
}

interface ProfileBioProps {
  bio?: string | null | undefined;
}

export function ProfileBio({ bio }: ProfileBioProps): ReactElement {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="bio-title">
      <h2 id="bio-title" className="text-xl font-semibold text-primary-white">
        Bio
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-primary-white">
        {bio || "No bio added yet."}
      </p>
    </section>
  );
}

interface ProfileBooksSectionProps {
  title: string;
  books: Book[];
  primaryCollection?: ReadingList | undefined;
  isFetching: boolean;
  emptyTitle: string;
  emptyDescription: string;
  canDelete?: boolean;
  isDeleting?: boolean;
  onDeleteBook?:
    | ((bookId: string | undefined, listId: number | null) => void)
    | undefined;
}

export function ProfileBooksSection({
  title,
  books,
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
        <h2 id="profile-books-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
          {title}
        </h2>
        {isFetching && books.length > 0 ? (
          <p className="text-xs text-primary-gray" role="status">
            Updating shelf...
          </p>
        ) : null}
      </div>
      {books.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Explore books"
          actionTo={routePaths.explore}
        />
      ) : (
        <BookShelfCarousel
          books={books}
          navigationClass={canDelete ? "profile-books" : "user-books"}
          primaryCollection={primaryCollection}
          canDelete={canDelete}
          isDeleting={isDeleting}
          onDeleteBook={onDeleteBook}
        />
      )}
    </section>
  );
}

interface BookShelfCarouselProps {
  books: Book[];
  navigationClass: string;
  primaryCollection?: ReadingList | undefined;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteBook?:
    | ((bookId: string | undefined, listId: number | null) => void)
    | undefined;
}

function BookShelfCarousel({
  books,
  navigationClass,
  primaryCollection,
  canDelete,
  isDeleting,
  onDeleteBook,
}: BookShelfCarouselProps): ReactElement {
  return (
    <Swiper
      modules={[Navigation, Pagination, A11y, Autoplay]}
      spaceBetween={20}
      slidesPerView={1}
      navigation={{
        prevEl: `.${navigationClass}-prev`,
        nextEl: `.${navigationClass}-next`,
      }}
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 28 },
      }}
      className="w-full relative"
    >
      {books.map((book) => (
        <SwiperSlide key={book.isbn13}>
          <div className="relative pr-2 pt-2">
            <BookCard
              to={routeBuilders.book(book.isbn13)}
              title={book.title}
              author={book.author}
              coverSrc={book.cover_img}
            />
            {canDelete && onDeleteBook ? (
              <DeleteBookButton
                book={book}
                listId={primaryCollection?.list_id ?? null}
                isDeleting={isDeleting}
                onDeleteBook={onDeleteBook}
              />
            ) : null}
          </div>
        </SwiperSlide>
      ))}
      <div className={`swiper-button-prev ${navigationClass}-prev`}></div>
      <div className={`swiper-button-next ${navigationClass}-next`}></div>
    </Swiper>
  );
}

interface DeleteBookButtonProps {
  book: Book;
  listId: number | null;
  isDeleting: boolean;
  onDeleteBook: (bookId: string | undefined, listId: number | null) => void;
}

function DeleteBookButton({
  book,
  listId,
  isDeleting,
  onDeleteBook,
}: DeleteBookButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={() => onDeleteBook(book.isbn13, listId)}
      className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black text-primary-white shadow-md hover:-translate-y-0.5 hover:bg-secondary-gray"
      aria-label={`Delete ${book.title} from collection`}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <InlineSpinner />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}

interface ProfileReviewsSectionProps {
  title: string;
  reviews?: BookReview[] | undefined;
  ratings?: BookRating[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRatingsError: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string | undefined;
  emptyActionTo?: string | undefined;
  canDelete?: boolean;
  isDeleting?: boolean;
  onRetry: () => void;
  onDeleteReview?: ((reviewId: string | number) => void) | undefined;
}

export function ProfileReviewsSection({
  title,
  reviews,
  ratings,
  isLoading,
  isFetching,
  isError,
  isRatingsError,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionTo,
  canDelete = false,
  isDeleting = false,
  onRetry,
  onDeleteReview,
}: ProfileReviewsSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="profile-reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="profile-reviews-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
          {title}
        </h2>
        {isFetching && reviews?.length ? (
          <p className="text-xs text-primary-gray" role="status">
            Updating reviews...
          </p>
        ) : null}
      </div>
      {isLoading ? <ReviewSkeleton /> : null}
      {isError || isRatingsError ? (
        <ErrorState
          title="Reviews could not be loaded"
          message="We could not load your reviews right now."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : null}
      {!isLoading && !isError && !isRatingsError && (reviews?.length ?? 0) === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          actionTo={emptyActionTo}
        />
      ) : null}
      {!isLoading && !isError && !isRatingsError
        ? reviews?.map((review, index) => (
            <ProfileReviewCard
              key={review.review_id}
              review={review}
              rating={ratings?.[index]?.rate ?? 0}
              canDelete={canDelete}
              isDeleting={isDeleting}
              onDeleteReview={onDeleteReview}
            />
          ))
        : null}
    </section>
  );
}

function ReviewSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-44 rounded-xl animate-shimmer" />
      ))}
    </div>
  );
}

interface ReviewCoverProps {
  src?: string | null | undefined;
  title?: string | null | undefined;
}

function ReviewCover({ src, title }: ReviewCoverProps): ReactElement {
  const [failed, setFailed] = useState(false);
  const canShowImage = Boolean(src) && !failed;
  const safeTitle = title || "Book";

  if (!canShowImage) {
    return (
      <div className="flex h-52 min-w-36 items-center justify-center rounded-xl bg-secondary-gray px-3 text-center text-2xl font-semibold text-primary-white">
        <span aria-hidden="true">{getInitials(safeTitle)}</span>
        <span className="sr-only">Cover unavailable for {safeTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src ?? undefined}
      className="h-52 min-w-36 rounded-xl object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
      alt={`Cover of ${safeTitle}`}
      width="144"
      height="208"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

interface ProfileReviewCardProps {
  review: BookReview;
  rating: number;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteReview?: ((reviewId: string | number) => void) | undefined;
}

function ProfileReviewCard({
  review,
  rating,
  canDelete,
  isDeleting,
  onDeleteReview,
}: ProfileReviewCardProps): ReactElement {
  return (
    <article className="rounded-xl bg-secondary-black p-4 text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to={routeBuilders.book(review.book)} className="shrink-0">
          <ReviewCover src={review.book_cover} title={review.book_title} />
        </Link>
        <div className="flex grow flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <strong className="line-clamp-2 text-lg" title={review.book_title || undefined}>
              {review.book_title || "Untitled book"}
            </strong>
            <RatingStars rating={rating} />
          </div>
          <p className="text-sm leading-relaxed">{review.review_text}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
            <span>{review.created_at}</span>
            {canDelete && onDeleteReview ? (
              <button
                type="button"
                onClick={() => onDeleteReview(review.review_id)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-2 font-medium text-primary-white hover:bg-primary-black"
                aria-label={`Delete review for ${review.book_title || "book"}`}
                disabled={isDeleting}
              >
                {isDeleting ? <InlineSpinner /> : "Delete"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

interface RatingStarsProps {
  rating: number;
}

function RatingStars({ rating }: RatingStarsProps): ReactElement {
  return (
    <p className="flex gap-1 text-sm" aria-label={`Reader rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={rating >= star ? "text-accent font-bold" : "text-primary-gray"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </p>
  );
}
