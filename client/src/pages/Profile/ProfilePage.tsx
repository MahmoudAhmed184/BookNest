import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import { toast } from "react-hot-toast";

import {
  getMyProfile,
  getUserReviews,
  getUserRatings,
  deleteReview,
} from "../../services/userService";
import { deleteBook } from "../../services/bookService";
import { getCollections } from "../../services/collectionService";
import type { DeleteBookPayload } from "../../types/book";
import BookCard from "../../components/BookCard";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import InlineSpinner from "../../components/InlineSpinner";

function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

function getInitials(value?: string | null): string {
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

function ProfileSkeleton(): ReactElement {
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

function ReviewCover({
  src,
  title,
}: {
  src?: string | null | undefined;
  title?: string | null | undefined;
}): ReactElement {
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

export default function Profile() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    isError: isUserError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () => getMyProfile(),
  });

  const {
    data: reviews,
    isLoading: isReviewsLoading,
    isFetching: isReviewsFetching,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => getUserReviews(user?.user_id),
    enabled: !!user?.user_id,
  });

  const { data: ratings, isError: isRatingsError, refetch: refetchRatings } = useQuery({
    queryKey: ["ratings"],
    queryFn: () => getUserRatings(user?.user_id),
    enabled: !!user?.user_id,
  });

  const {
    data: collections,
    isLoading: isCollectionsLoading,
    isFetching: isCollectionsFetching,
    isError: isCollectionsError,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollections(localStorage.getItem("token")),
  });

  const primaryCollection = collections?.[0];
  const books = primaryCollection?.books || [];
  const bookCount = books.length || primaryCollection?.book_count || 0;

  const deleteMutation = useMutation({
    mutationFn: (payload: DeleteBookPayload) => deleteBook(payload),
    onSuccess: () => {
      toast.success("Book removed from your shelf.");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: () => {
      toast.error("Couldn't remove the book. Try again.");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string | number) => deleteReview(reviewId),
    onSuccess: () => {
      toast.success("Review deleted.");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: () => {
      toast.error("Couldn't delete the review. Try again.");
    },
  });

  const handleDelete = (
    bookId: string | undefined,
    listId: number | null
  ): void => {
    if (
      window.confirm(
        "Are you sure you want to delete this book from the library?"
      )
    ) {
      deleteMutation.mutate({ book_id: bookId, list_id: listId });
    }
  };

  const handleDeleteReview = (reviewId: string | number): void => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  if (isUserLoading || isCollectionsLoading) return <ProfileSkeleton />;

  if (isUserError || isCollectionsError || !user) {
    return (
      <div className="py-12">
        <ErrorState
          title="Profile could not be loaded"
          message="We could not load your profile and library right now."
          onRetry={() => {
            void refetchUser();
            void refetchCollections();
          }}
          isRetrying={isUserFetching || isCollectionsFetching}
        />
      </div>
    );
  }

  const profileImage = resolveProfileImage(user.profile_pic);

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <section className="flex flex-col gap-6 md:flex-row md:items-end">
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
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-primary-white text-balance">
            {user.username}
          </h1>
          <Link
            to="/settings"
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            aria-label={`Edit ${user.username}'s profile`}
          >
            Edit Profile
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Reading stats">
        <div className="rounded-xl bg-secondary-black p-5">
          <p className="text-3xl font-bold text-primary-white">{bookCount}</p>
          <p className="text-xs uppercase text-primary-gray">Books shelved</p>
        </div>
        <div className="rounded-xl bg-secondary-black p-5">
          <p className="text-3xl font-bold text-primary-white">
            {reviews?.length ?? 0}
          </p>
          <p className="text-xs uppercase text-primary-gray">Reviews</p>
        </div>
        <div className="rounded-xl bg-secondary-black p-5">
          <p className="text-3xl font-bold text-primary-white">
            {ratings?.length ?? 0}
          </p>
          <p className="text-xs uppercase text-primary-gray">Ratings</p>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="bio-title">
        <h2 id="bio-title" className="text-xl font-semibold text-primary-white">
          Bio
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-primary-white">
          {user.bio || "No bio added yet."}
        </p>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="my-books-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="my-books-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
            My Books
          </h2>
          {isCollectionsFetching && books.length > 0 ? (
            <p className="text-xs text-primary-gray" role="status">
              Updating shelf...
            </p>
          ) : null}
        </div>
        {books.length === 0 ? (
          <EmptyState
            title="No books added yet"
            description="Start building your shelf with books you want to read, love, or recommend."
            actionLabel="Explore books"
            actionTo="/explore"
          />
        ) : (
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation={{
              prevEl: ".profile-books-prev",
              nextEl: ".profile-books-next",
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
                    to={`/book/${book.isbn13}`}
                    title={book.title}
                    author={book.author}
                    coverSrc={book.cover_img}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(book.isbn13, primaryCollection?.list_id ?? null)
                    }
                    className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black text-primary-white shadow-md hover:-translate-y-0.5 hover:bg-secondary-gray"
                    aria-label={`Delete ${book.title} from collection`}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <InlineSpinner />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev profile-books-prev"></div>
            <div className="swiper-button-next profile-books-next"></div>
          </Swiper>
        )}
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="my-reviews-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="my-reviews-title" className="text-xl font-semibold text-primary-white sm:text-2xl">
            My Reviews
          </h2>
          {isReviewsFetching && reviews?.length ? (
            <p className="text-xs text-primary-gray" role="status">
              Updating reviews...
            </p>
          ) : null}
        </div>
        {isReviewsLoading ? (
          <div className="flex flex-col gap-4" role="status" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-44 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : null}
        {isReviewsError || isRatingsError ? (
          <ErrorState
            title="Reviews could not be loaded"
            message="We could not load your reviews right now."
            onRetry={() => {
              void refetchReviews();
              void refetchRatings();
            }}
            isRetrying={isReviewsFetching}
          />
        ) : null}
        {!isReviewsLoading &&
        !isReviewsError &&
        !isRatingsError &&
        (reviews?.length ?? 0) === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Your thoughts on finished books will show up here."
            actionLabel="Find a book"
            actionTo="/search"
          />
        ) : null}
        {!isReviewsLoading &&
        !isReviewsError &&
        !isRatingsError &&
        reviews?.map((review, index) => (
          <article
            key={review.review_id}
            className="rounded-xl bg-secondary-black p-4 text-primary-white shadow-md transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to={`/book/${review.book}`} className="shrink-0">
                <ReviewCover src={review.book_cover} title={review.book_title} />
              </Link>
              <div className="flex grow flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <strong className="line-clamp-2 text-lg" title={review.book_title || undefined}>
                    {review.book_title || "Untitled book"}
                  </strong>
                  <p
                    className="flex gap-1 text-sm"
                    aria-label={`Your rating ${ratings?.[index]?.rate ?? 0} out of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          (ratings?.[index]?.rate ?? 0) >= star
                            ? "text-accent font-bold"
                            : "text-primary-gray"
                        }
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </p>
                </div>
                <p className="text-sm leading-relaxed">{review.review_text}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-primary-gray">
                  <span>{review.created_at}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(review.review_id)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full px-3 py-2 font-medium text-primary-white hover:bg-primary-black"
                    aria-label={`Delete review for ${review.book_title || "book"}`}
                    disabled={deleteReviewMutation.isPending}
                  >
                    {deleteReviewMutation.isPending ? <InlineSpinner /> : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
