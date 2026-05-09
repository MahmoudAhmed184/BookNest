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
import {
  favoriteGenreFromCollections,
  getProfileDisplayName,
} from "../utils/profileDisplay";

interface FollowIconProps {
  isFollowed?: boolean | undefined;
}

function FollowIcon({ isFollowed = false }: FollowIconProps): ReactElement {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      {isFollowed ? <path d="m16 11 2 2 4-4" /> : <path d="M19 8v6M16 11h6" />}
    </svg>
  );
}

export default function UserProfile(): ReactElement {
  const { handle } = useParams<UserProfileRouteParams>();
  const { authUser, token, user: isAuthenticated } = useOptionalAuth();
  const {
    user,
    reviews,
    ratings,
    collections,
    stats,
    viewerContext,
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
  } = useUserProfilePageData(handle, token);
  const targetUserId = user?.user.id;
  const { data: existingFollow = null } = useFollowStatus(targetUserId, token);
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
  const favoriteGenre = favoriteGenreFromCollections(collections, user.interest_links);
  const displayName = getProfileDisplayName(user);
  const userId = user.user.id;
  const profileRouteParam = user.handle || userId;
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
            className={`btn inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
              isFollowed ? "btn-primary-v" : "btn-accent-v"
            }`}
            aria-pressed={isFollowed}
            aria-label={`${isFollowed ? "Unfollow" : "Follow"} ${displayName}`}
            aria-busy={isFollowBusy}
          >
            <FollowIcon isFollowed={isFollowed} />
            {isFollowed ? "Following" : "Follow"}
          </button>
        ) : (
          <Link
            to={isAuthenticated ? routePaths.myProfile : routePaths.login}
            className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm font-medium shadow-md hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FollowIcon />
            {isAuthenticated ? "Your profile" : "Sign in to follow"}
          </Link>
        )}
        <Link
          to={routeBuilders.profileFollowers(profileRouteParam)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {followerCount} followers
        </Link>
        <Link
          to={routeBuilders.profileFollowing(profileRouteParam)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {followingCount} following
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 py-8 sm:gap-12 sm:py-12 animate-fade-up">
      <ProfileHeader
        user={user}
        center
        stats={stats}
        collections={collections}
        favoriteGenre={favoriteGenre}
        isOwnProfile={viewerContext?.is_self}
        action={followAction}
      />
      <ReadingStats
        bookCount={
          stats?.books_read_count ??
          (items.length || primaryCollection?.item_count || 0)
        }
        reviewCount={stats?.reviews_count ?? reviews?.length ?? 0}
        ratingCount={stats?.ratings_count ?? ratings?.length ?? 0}
        collectionCount={stats?.collections_count ?? collections?.length ?? 0}
        favoriteGenre={favoriteGenre}
      />
      <ProfileBio user={user} />
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
