import { useMemo, useState, type ReactElement } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { routeBuilders, type UserProfileRouteParams } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  useProfileFollowers,
  useProfileFollowing,
} from "../hooks/followHooks";
import type { FollowProfileRow } from "../types/follow";
import type { UserProfile } from "../../profile/types/user";

function getProfileName(profile: UserProfile): string {
  return profile.full_name || profile.username;
}

function ConnectionCard({ row }: { row: FollowProfileRow }): ReactElement {
  const { profile } = row;
  const displayName = getProfileName(profile);

  return (
    <Link
      to={routeBuilders.userProfile(profile.id)}
      className="glass-card card-lift flex items-center gap-4 p-4"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary-black">
        {profile.profile_pic ? (
          <img
            src={profile.profile_pic}
            alt={`${profile.username}'s profile image`}
            className="h-full w-full object-cover"
            width="56"
            height="56"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="fallback-gradient flex h-full w-full items-center justify-center text-lg font-bold text-primary-white"
            style={getFallbackHueStyle(profile.username)}
          >
            {getInitials(profile.username)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-primary-white">
          {displayName}
        </h2>
        <p className="truncate text-sm text-primary-gray">@{profile.username}</p>
        {profile.bio ? (
          <p className="mt-1 line-clamp-2 text-sm text-primary-gray">
            {profile.bio}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function ProfileConnectionsPage(): ReactElement {
  const { id } = useParams<UserProfileRouteParams>();
  const location = useLocation();
  const { token } = useOptionalAuth();
  const [filter, setFilter] = useState("");
  const isFollowersPage = location.pathname.endsWith("/followers");
  const title = isFollowersPage ? "Followers" : "Following";
  const description = isFollowersPage
    ? "Readers following this profile."
    : "Profiles this reader follows.";
  const followersQuery = useProfileFollowers(id, token, isFollowersPage);
  const followingQuery = useProfileFollowing(id, token, !isFollowersPage);
  const activeQuery = isFollowersPage ? followersQuery : followingQuery;
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredRows = useMemo(
    () => {
      const rows = activeQuery.data ?? [];

      return rows.filter((row) => {
        const haystack = [
          row.profile.username,
          row.profile.full_name ?? "",
          row.profile.bio ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedFilter);
      });
    },
    [activeQuery.data, normalizedFilter]
  );

  if (activeQuery.isLoading) {
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

  if (activeQuery.isError) {
    return (
      <div className="py-12">
        <ErrorState
          title={`${title} could not be loaded`}
          message="We could not load these profile connections right now."
          onRetry={() => {
            void activeQuery.refetch();
          }}
          isRetrying={activeQuery.isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <Link
          to={routeBuilders.userProfile(id ?? "")}
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
            <ConnectionCard key={row.id} row={row} />
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
    </div>
  );
}
