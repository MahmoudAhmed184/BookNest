import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { ErrorState } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import type { Book, BookReview } from "../../catalog/types/book";
import { routePaths } from "../../../routes/paths";
import {
  CollectionsShelf,
  DeleteBookDialog,
  DeleteReviewDialog,
  ProfileBio,
  ProfileBooksSection,
  ProfileHeader,
  ProfileReviewsSection,
  ProfileSkeleton,
  ReadingStats,
} from "../components/ProfileSections";
import { useProfileActions } from "../hooks/useProfileActions";
import { useProfilePageData } from "../hooks/useProfilePageData";

interface PendingBookDelete {
  book: Book;
  listId: number | null;
}

export default function Profile(): ReactElement {
  const { token } = useOptionalAuth();
  const [pendingBookDelete, setPendingBookDelete] = useState<PendingBookDelete | null>(null);
  const [pendingReviewDelete, setPendingReviewDelete] = useState<BookReview | null>(null);
  const {
    user,
    reviews,
    ratings,
    collections,
    isUserLoading,
    isUserFetching,
    isUserError,
    isReviewsLoading,
    isReviewsFetching,
    isReviewsError,
    isRatingsError,
    isCollectionsLoading,
    isCollectionsFetching,
    isCollectionsError,
    refetchUser,
    refetchReviews,
    refetchRatings,
    refetchCollections,
  } = useProfilePageData(token);
  const profileActions = useProfileActions(token);

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

  const primaryCollection = collections?.[0];
  const books = primaryCollection?.books || [];
  const bookCount = books.length || primaryCollection?.book_count || 0;
  const favoriteGenre = books[0]?.genres?.[0] ?? "Eclectic";

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <ProfileHeader
        user={user}
        action={
          <Link
            to={routePaths.settings}
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            aria-label={`Edit ${user.username}'s profile`}
          >
            Edit Profile
          </Link>
        }
      />
      <ReadingStats
        bookCount={bookCount}
        reviewCount={reviews?.length ?? 0}
        ratingCount={ratings?.length ?? 0}
        favoriteGenre={favoriteGenre}
      />
      <ProfileBio bio={user.bio} />
      <CollectionsShelf collections={collections} />
      <ProfileBooksSection
        title="My Books"
        books={books}
        primaryCollection={primaryCollection}
        isFetching={isCollectionsFetching}
        emptyTitle="No books added yet"
        emptyDescription="Start building your shelf with books you want to read, love, or recommend."
        canDelete
        isDeleting={profileActions.isDeletingBook}
        onDeleteBook={(book, listId) => {
          setPendingBookDelete({ book, listId });
        }}
      />
      <ProfileReviewsSection
        title="My Reviews"
        reviews={reviews}
        ratings={ratings}
        isLoading={isReviewsLoading}
        isFetching={isReviewsFetching}
        isError={isReviewsError}
        isRatingsError={isRatingsError}
        emptyTitle="No reviews yet"
        emptyDescription="Your thoughts on finished books will show up here."
        emptyActionLabel="Find a book"
        emptyActionTo={routePaths.search}
        canDelete
        isDeleting={profileActions.isDeletingReview}
        onRetry={() => {
          void refetchReviews();
          void refetchRatings();
        }}
        onDeleteReview={(review) => {
          setPendingReviewDelete(review);
        }}
      />
      <DeleteBookDialog
        book={pendingBookDelete?.book ?? null}
        isDeleting={profileActions.isDeletingBook}
        onCancel={() => setPendingBookDelete(null)}
        onConfirm={() => {
          if (!pendingBookDelete) return;

          profileActions.deleteBookFromShelf({
            book_id: pendingBookDelete.book.isbn13,
            list_id: pendingBookDelete.listId,
          });
          setPendingBookDelete(null);
        }}
      />
      <DeleteReviewDialog
        review={pendingReviewDelete}
        isDeleting={profileActions.isDeletingReview}
        onCancel={() => setPendingReviewDelete(null)}
        onConfirm={() => {
          if (!pendingReviewDelete) return;

          profileActions.deleteProfileReview(pendingReviewDelete.review_id);
          setPendingReviewDelete(null);
        }}
      />
    </div>
  );
}
