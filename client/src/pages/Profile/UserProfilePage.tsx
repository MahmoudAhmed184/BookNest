import { useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { ErrorState } from "../../components/ErrorState";
import {
  ProfileBio,
  ProfileBooksSection,
  ProfileHeader,
  ProfileReviewsSection,
  ProfileSkeleton,
  ReadingStats,
} from "../../features/profile/components/ProfileSections";
import { useUserProfilePageData } from "../../features/profile/hooks/useUserProfilePageData";
import type { UserProfileRouteParams } from "../../routes";

export default function UserProfile(): ReactElement {
  const { id } = useParams<UserProfileRouteParams>();
  const [isFollowing, setIsFollowing] = useState(false);
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
  } = useUserProfilePageData(id);

  if (isUserLoading || isCollectionsLoading) return <ProfileSkeleton />;

  if (isUserError || isCollectionsError || !user) {
    return (
      <div className="py-12">
        <ErrorState
          title="Profile could not be loaded"
          message="We could not load this reader profile right now."
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

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <ProfileHeader
        user={user}
        center
        action={
          <button
            type="button"
            onClick={() => setIsFollowing((current) => !current)}
            className={`btn inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
              isFollowing ? "btn-primary-v" : "btn-accent-v"
            }`}
            aria-pressed={isFollowing}
            aria-label={`Follow ${user.username}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        }
      />
      <ReadingStats
        bookCount={books.length || primaryCollection?.book_count || 0}
        reviewCount={reviews?.length ?? 0}
        ratingCount={ratings?.length ?? 0}
      />
      <ProfileBio bio={user.bio} />
      <ProfileBooksSection
        title="Books"
        books={books}
        primaryCollection={primaryCollection}
        isFetching={isCollectionsFetching}
        emptyTitle="No books added yet"
        emptyDescription="This reader's shelf is empty for now."
      />
      <ProfileReviewsSection
        title="Reviews"
        reviews={reviews}
        ratings={ratings}
        isLoading={isReviewsLoading}
        isFetching={isReviewsFetching}
        isError={isReviewsError}
        isRatingsError={isRatingsError}
        emptyTitle="No reviews yet"
        emptyDescription="This reader has not shared any reviews yet."
        onRetry={() => {
          void refetchReviews();
          void refetchRatings();
        }}
      />
    </div>
  );
}
