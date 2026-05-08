import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { ErrorState } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import type { BookReview } from "../../catalog/types/book";
import type { CollectionBook } from "../../collections/types/collection";
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
  item: CollectionBook;
}

export default function Profile(): ReactElement {
  const { token } = useAuth();
  const [pendingBookDelete, setPendingBookDelete] = useState<PendingBookDelete | null>(null);
  const [pendingReviewDelete, setPendingReviewDelete] = useState<BookReview | null>(null);
  const {
    user,
    reviews,
    ratings,
    collections,
    stats,
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
  const items = primaryCollection?.items || [];
  const bookCount = items.length || primaryCollection?.item_count || 0;
  const favoriteGenre = items[0]?.book_detail?.genres?.[0]?.name ?? "Eclectic";

  return (
    <>
      <div className="flex flex-col gap-12 py-12 animate-fade-up">
        <ProfileHeader
          user={user}
          action={
            <Link
              to={routePaths.settings}
              className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
              aria-label={`Edit ${user.handle}'s profile`}
            >
              Edit Profile
            </Link>
          }
        />
        <ReadingStats
          bookCount={stats?.books_read_count ?? bookCount}
          reviewCount={stats?.reviews_count ?? reviews?.length ?? 0}
          ratingCount={stats?.ratings_count ?? ratings?.length ?? 0}
          favoriteGenre={favoriteGenre}
        />
        <ProfileBio bio={user.bio} />
        <CollectionsShelf collections={collections} />
        <ProfileBooksSection
          title="My Books"
          items={items}
          primaryCollection={primaryCollection}
          isFetching={isCollectionsFetching}
          emptyTitle="No books added yet"
          emptyDescription="Start building your shelf with books you want to read, love, or recommend."
          canDelete
          isDeleting={profileActions.isDeletingBook}
          onDeleteBook={(item) => {
            setPendingBookDelete({ item });
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
      </div>
      <DeleteBookDialog
        book={pendingBookDelete?.item.book_detail ?? null}
        isDeleting={profileActions.isDeletingBook}
        onCancel={() => setPendingBookDelete(null)}
        onConfirm={() => {
          if (!pendingBookDelete) return;

          profileActions.deleteBookFromShelf({
            collection_book_id: pendingBookDelete.item.id,
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

          profileActions.deleteProfileReview(pendingReviewDelete.id);
          setPendingReviewDelete(null);
        }}
      />
    </>
  );
}
