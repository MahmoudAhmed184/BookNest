import { type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  useFollowMutations,
  useFollowStatus,
} from "../../follows/hooks/followHooks";
import {
  CollectionsShelf,
  ProfileBio,
  ProfileBooksSection,
  ProfileHeader,
  ProfileReviewsSection,
  ProfileSkeleton,
  ReadingStats,
} from "../components/ProfileSections";
import { useUserProfilePageData } from "../hooks/useUserProfilePageData";
import { routeBuilders, routePaths, type UserProfileRouteParams } from "../../../routes/paths";

export default function UserProfile(): ReactElement {
  const { id } = useParams<UserProfileRouteParams>();
  const { authUser, token, user: isAuthenticated } = useOptionalAuth();
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
  } = useUserProfilePageData(id, token);
  const { data: existingFollow = null } = useFollowStatus(id, token);
  const {
    followUser,
    unfollowById,
    isFollowing: isFollowPending,
    isUnfollowing,
  } = useFollowMutations(token);

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
  const items = primaryCollection?.items || [];
  const favoriteGenre = items[0]?.book_detail?.genres?.[0]?.name ?? "Eclectic";
  const userId = user.user.id;
  const canUseFollowButton =
    isAuthenticated &&
    Number.isFinite(userId) &&
    authUser?.id !== userId;
  const isFollowed = Boolean(existingFollow);
  const isFollowBusy = isFollowPending || isUnfollowing;
  const followerCount = stats?.followers_count ?? user.followers_count ?? 0;
  const followingCount = stats?.following_count ?? user.following_count ?? 0;
  const toggleFollow = (): void => {
    if (!canUseFollowButton || isFollowBusy) return;

    if (existingFollow) {
      void unfollowById(existingFollow.id);
      return;
    }

    void followUser(userId);
  };
  const followAction = (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        {canUseFollowButton ? (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={isFollowBusy}
            className={`btn inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
              isFollowed ? "btn-primary-v" : "btn-accent-v"
            }`}
            aria-pressed={isFollowed}
            aria-label={`${isFollowed ? "Unfollow" : "Follow"} ${user.handle}`}
            aria-busy={isFollowBusy}
          >
            {isFollowed ? "Following" : "Follow"}
          </button>
        ) : (
          <Link
            to={isAuthenticated ? routePaths.myProfile : routePaths.login}
            className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isAuthenticated ? "Your profile" : "Sign in to follow"}
          </Link>
        )}
        <Link
          to={routeBuilders.profileFollowers(user.user.id)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {followerCount} followers
        </Link>
        <Link
          to={routeBuilders.profileFollowing(user.user.id)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {followingCount} following
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <ProfileHeader user={user} center action={followAction} />
      <ReadingStats
        bookCount={
          stats?.books_read_count ??
          (items.length || primaryCollection?.item_count || 0)
        }
        reviewCount={stats?.reviews_count ?? reviews?.length ?? 0}
        ratingCount={stats?.ratings_count ?? ratings?.length ?? 0}
        favoriteGenre={favoriteGenre}
      />
      <ProfileBio bio={user.bio} />
      <CollectionsShelf collections={collections} />
      <ProfileBooksSection
        title="Books"
        items={items}
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
