import { useMemo, useState, type ReactElement } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  InlineSpinner,
  LoadMorePagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import {
  isNumericRouteParam,
  routeBuilders,
  type UserProfileRouteParams,
} from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import { useUserProfilePageData } from "../../profile/hooks/useUserProfilePageData";
import {
  getUserDisplayName,
  resolveProfileImage,
} from "../../profile/utils/profileDisplay";
import {
  useProfileFollowers,
  useProfileFollowing,
} from "../hooks/followHooks";
import type { FollowProfileSummary, FollowRelationship } from "../types/follow";
import type { User } from "../../profile/types/user";

function getUserName(
  user: User | undefined,
  profile: FollowProfileSummary | undefined
): string {
  return profile?.name?.trim() || getUserDisplayName(user);
}

function ConnectionCard({
  row,
  isFollowersPage,
}: {
  row: FollowRelationship;
  isFollowersPage: boolean;
}): ReactElement | null {
  const [hasImageError, setHasImageError] = useState(false);
  const user = isFollowersPage ? row.follower_detail : row.following_detail;
  const profile = isFollowersPage ? row.follower_profile : row.following_profile;
  const profileParam = profile?.handle ?? user?.id;
  if (!profileParam) return null;

  const displayName = getUserName(user, profile);
  const profileImage = resolveProfileImage(
    profile?.picture || profile?.picture_fallback_url
  );
  const canShowImage = Boolean(profileImage) && !hasImageError;

  return (
    <Link
      to={routeBuilders.userProfile(profileParam)}
      className="glass-card card-lift flex items-center gap-4 p-4"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary-black">
        {canShowImage ? (
          <img
            src={profileImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div
            className="fallback-gradient flex h-full w-full items-center justify-center text-lg font-bold text-primary-white"
            style={getFallbackHueStyle(displayName)}
          >
            {getInitials(displayName)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-primary-white">
          {displayName}
        </h2>
        {profile?.handle ? (
          <p className="truncate text-sm text-primary-gray">@{profile.handle}</p>
        ) : null}
      </div>
    </Link>
  );
}

export default function ProfileConnectionsPage(): ReactElement {
  const { handle } = useParams<UserProfileRouteParams>();
  const location = useLocation();
  const { token } = useOptionalAuth();
  const { page, setPage } = usePageSearchParam();
  const [filter, setFilter] = useState("");
  const isFollowersPage = location.pathname.endsWith("/followers");
  const isRouteUserId = isNumericRouteParam(handle);
  const profileQuery = useUserProfilePageData(handle, token, {
    enabled: !isRouteUserId,
  });
  const targetUserId = isRouteUserId ? handle : profileQuery.user?.user.id;
  const profileRouteParam = profileQuery.user?.handle ?? handle ?? "";
  const title = isFollowersPage ? "Followers" : "Following";
  const description = isFollowersPage
    ? "Readers following this profile."
    : "Profiles this reader follows.";
  const followersQuery = useProfileFollowers(
    targetUserId,
    page,
    token,
    isFollowersPage && Boolean(targetUserId)
  );
  const followingQuery = useProfileFollowing(
    targetUserId,
    page,
    token,
    !isFollowersPage && Boolean(targetUserId)
  );
  const activeQuery = isFollowersPage ? followersQuery : followingQuery;
  const activePage = activeQuery.data;
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredRows = useMemo(
    () => {
      const rows = activePage?.results ?? [];

      return rows.filter((row) => {
        const haystack = [
          row.follower_detail?.email ?? "",
          row.follower_detail?.name ?? "",
          row.follower_detail?.display_name ?? "",
          row.follower_profile?.handle ?? "",
          row.follower_profile?.name ?? "",
          row.following_detail?.email ?? "",
          row.following_detail?.name ?? "",
          row.following_detail?.display_name ?? "",
          row.following_profile?.handle ?? "",
          row.following_profile?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedFilter);
      });
    },
    [activePage?.results, normalizedFilter]
  );

  const loadMore = (): void => {
    setPage(page + 1);
  };

  if ((!isRouteUserId && profileQuery.isUserLoading) || activeQuery.isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <InlineSpinner />
      </div>
    );
  }

  if ((!isRouteUserId && profileQuery.isUserError) || activeQuery.isError) {
    return (
      <div className="py-12">
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load these profile connections right now."
          onRetry={() => {
            if (!isRouteUserId) void profileQuery.refetchUser();
            void activeQuery.refetch();
          }}
          isRetrying={profileQuery.isUserFetching || activeQuery.isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <Link
          to={routeBuilders.userProfile(profileRouteParam)}
          className="text-sm font-semibold text-accent transition hover:text-primary-white"
        >
          Back to profile
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="display-heading text-3xl sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm text-primary-gray">{description}</p>
        </div>
      </header>

      <label className="flex max-w-xl flex-col gap-2 text-sm font-medium text-primary-white">
        Filter profiles
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="min-h-[44px] rounded-xl border border-[var(--surface-glass-border)] bg-primary-black/60 px-4 py-2 text-primary-white outline-none transition focus:border-accent"
          placeholder="Search by name, username, or bio"
        />
      </label>

      {filteredRows.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((row) => (
            <ConnectionCard
              key={row.id}
              row={row}
              isFollowersPage={isFollowersPage}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={filter ? "No matching profiles" : `No ${title.toLowerCase()} yet`}
          description={
            filter
              ? "Adjust the filter to find another reader."
              : "This connection list is empty for now."
          }
        />
      )}
      {activePage ? (
        <LoadMorePagination
          shownCount={activePage.results.length}
          totalCount={activePage.count}
          hasMore={activePage.hasNext}
          onLoadMore={loadMore}
          isLoading={activeQuery.isLoadingMore}
          itemLabel="profiles"
          ariaLabel={`More ${title.toLowerCase()}`}
        />
      ) : null}
    </div>
  );
}
