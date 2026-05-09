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
import { favoriteGenreFromCollections } from "../utils/profileDisplay";

interface PendingBookDelete {
  item: CollectionBook;
}

function EditProfileIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
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
  const favoriteGenre = favoriteGenreFromCollections(collections, user.interest_links);

  return (
    <>
      <div className="flex flex-col gap-10 py-8 sm:gap-12 sm:py-12 animate-fade-up">
        <ProfileHeader
          user={user}
          stats={stats}
          collections={collections}
          favoriteGenre={favoriteGenre}
          isOwnProfile
          action={
            <Link
              to={routePaths.settings}
              className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
              aria-label={`Edit ${user.handle}'s profile`}
            >
              <EditProfileIcon />
              Edit Profile
            </Link>
          }
        />
        <ReadingStats
          bookCount={stats?.books_read_count ?? bookCount}
          reviewCount={stats?.reviews_count ?? reviews?.length ?? 0}
          ratingCount={stats?.ratings_count ?? ratings?.length ?? 0}
          collectionCount={stats?.collections_count ?? collections?.length ?? 0}
          favoriteGenre={favoriteGenre}
        />
        <ProfileBio user={user} />
        <CollectionsShelf collections={collections} canOpenCollections />
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
