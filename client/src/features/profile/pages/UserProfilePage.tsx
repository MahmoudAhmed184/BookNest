import { useMemo, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  useFollowMutations,
  useFollows,
  useProfileFollowers,
  useProfileFollowing,
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
  const { data: follows = [] } = useFollows(token);
  const { data: followers = [] } = useProfileFollowers(id, token);
  const { data: following = [] } = useProfileFollowing(id, token);
  const {
    followProfile,
    unfollowById,
    isFollowing: isFollowPending,
    isUnfollowing,
  } = useFollowMutations(token);

  const existingFollow = useMemo(
    () =>
      follows.find((follow) => {
        const followedId = follow.followed ?? follow.followed_detail?.id;
        return followedId !== undefined && String(followedId) === String(id);
      }),
    [follows, id]
  );

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
  const favoriteGenre = books[0]?.genres?.[0] ?? "Eclectic";
  const profileId = Number(user.id);
  const canUseFollowButton =
    isAuthenticated &&
    Number.isFinite(profileId) &&
    authUser?.username !== user.username;
  const isFollowed = Boolean(existingFollow);
  const isFollowBusy = isFollowPending || isUnfollowing;
  const toggleFollow = (): void => {
    if (!canUseFollowButton || isFollowBusy) return;

    if (existingFollow) {
      void unfollowById(existingFollow.id);
      return;
    }

    void followProfile(profileId);
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
            aria-label={`${isFollowed ? "Unfollow" : "Follow"} ${user.username}`}
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
          to={routeBuilders.profileFollowers(user.id)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {followers.length} followers
        </Link>
        <Link
          to={routeBuilders.profileFollowing(user.id)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--surface-glass-border)] px-4 py-2 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
        >
          {following.length} following
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 py-12 animate-fade-up">
      <ProfileHeader user={user} center action={followAction} />
      <ReadingStats
        bookCount={books.length || primaryCollection?.book_count || 0}
        reviewCount={reviews?.length ?? 0}
        ratingCount={ratings?.length ?? 0}
        favoriteGenre={favoriteGenre}
      />
      <ProfileBio bio={user.bio} />
      <CollectionsShelf collections={collections} />
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
