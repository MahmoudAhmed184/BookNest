import { useMemo, useState, type ReactElement } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  InlineSpinner,
  Pagination,
} from "../../../components/ui";
import { usePageSearchParam } from "../../../hooks/usePageSearchParam";
import { routeBuilders, type UserProfileRouteParams } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import {
  useProfileFollowers,
  useProfileFollowing,
} from "../hooks/followHooks";
import type { FollowRelationship } from "../types/follow";
import type { User } from "../../profile/types/user";

function getUserName(user: User): string {
  return user.display_name || user.email;
}

function ConnectionCard({
  row,
  isFollowersPage,
}: {
  row: FollowRelationship;
  isFollowersPage: boolean;
}): ReactElement | null {
  const user = isFollowersPage ? row.follower_detail : row.following_detail;
  if (!user) return null;

  const displayName = getUserName(user);

  return (
    <Link
      to={routeBuilders.userProfile(user.id)}
      className="glass-card card-lift flex items-center gap-4 p-4"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary-black">
        <div
          className="fallback-gradient flex h-full w-full items-center justify-center text-lg font-bold text-primary-white"
          style={getFallbackHueStyle(displayName)}
        >
          {getInitials(displayName)}
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-primary-white">
          {displayName}
        </h2>
        <p className="truncate text-sm text-primary-gray">{user.email}</p>
      </div>
    </Link>
  );
}

export default function ProfileConnectionsPage(): ReactElement {
  const { id } = useParams<UserProfileRouteParams>();
  const location = useLocation();
  const { token } = useOptionalAuth();
  const { page, setPage } = usePageSearchParam();
  const [filter, setFilter] = useState("");
  const isFollowersPage = location.pathname.endsWith("/followers");
  const title = isFollowersPage ? "Followers" : "Following";
  const description = isFollowersPage
    ? "Readers following this profile."
    : "Profiles this reader follows.";
  const followersQuery = useProfileFollowers(id, page, token, isFollowersPage);
  const followingQuery = useProfileFollowing(id, page, token, !isFollowersPage);
  const activeQuery = isFollowersPage ? followersQuery : followingQuery;
  const activePage = activeQuery.data;
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredRows = useMemo(
    () => {
      const rows = activePage?.results ?? [];

      return rows.filter((row) => {
        const haystack = [
          row.follower_detail?.email ?? "",
          row.follower_detail?.display_name ?? "",
          row.following_detail?.email ?? "",
          row.following_detail?.display_name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedFilter);
      });
    },
    [activePage?.results, normalizedFilter]
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
        <Pagination
          currentPage={activePage.page}
          totalPages={activePage.totalPages}
          hasNextPage={activePage.hasNext}
          hasPreviousPage={activePage.hasPrevious}
          onPageChange={setPage}
          isDisabled={activeQuery.isFetching}
          ariaLabel={`${title} pages`}
        />
      ) : null}
    </div>
  );
}
