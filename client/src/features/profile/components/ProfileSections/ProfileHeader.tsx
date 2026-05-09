import { useEffect, useState, type ReactElement } from "react";

import type { ReadingCollection } from "../../../collections/types/collection";
import type { ProfileOverviewStats, UserProfile } from "../../types/user";
import {
  formatCompactNumber,
  formatProfileDate,
  getFallbackHueStyle,
  getInitials,
  getProfileDisplayName,
  profileTypeLabel,
  recentProfileCovers,
  resolveProfileImage,
} from "../../utils/profileDisplay";

export interface ProfileHeaderProps {
  user: UserProfile;
  action: ReactElement;
  center?: boolean | undefined;
  stats?: ProfileOverviewStats | undefined;
  collections?: ReadingCollection[] | undefined;
  favoriteGenre?: string | undefined;
  isOwnProfile?: boolean | undefined;
}

type ProfileHeaderIconName =
  | "book"
  | "calendar"
  | "collection"
  | "pin"
  | "reader"
  | "spark"
  | "star"
  | "users";

interface ProfileHeaderIconProps {
  name: ProfileHeaderIconName;
  className?: string | undefined;
}

interface MetaPillProps {
  icon: ProfileHeaderIconName;
  children: string;
}

interface StatChipProps {
  icon: ProfileHeaderIconName;
  value: number | undefined;
  label: string;
}

function ProfileHeaderIcon({
  name,
  className = "h-4 w-4",
}: ProfileHeaderIconProps): ReactElement {
  const commonProps = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "book") {
    return (
      <svg {...commonProps}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
      </svg>
    );
  }

  if (name === "collection") {
    return (
      <svg {...commonProps}>
        <path d="M5 7h14M5 12h14M5 17h14" />
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...commonProps}>
        <path d="M12 22s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "reader") {
    return (
      <svg {...commonProps}>
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...commonProps}>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

function MetaPill({ icon, children }: MetaPillProps): ReactElement {
  return (
    <span className="inline-flex min-h-[36px] max-w-full items-center gap-2 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/35 px-3 py-1.5 text-xs font-semibold text-primary-gray backdrop-blur">
      <ProfileHeaderIcon name={icon} />
      <span className="truncate">{children}</span>
    </span>
  );
}

function StatChip({ icon, value, label }: StatChipProps): ReactElement {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--surface-glass-border)] bg-[var(--surface-panel)] p-3 shadow-sm">
      <div className="flex items-center gap-2 text-accent">
        <ProfileHeaderIcon name={icon} />
        <span className="truncate text-2xl font-extrabold leading-none text-primary-white">
          {formatCompactNumber(value)}
        </span>
      </div>
      <p className="mt-1 truncate text-xs font-semibold uppercase text-primary-gray">
        {label}
      </p>
    </div>
  );
}

export function ProfileHeader({
  user,
  action,
  center = false,
  stats,
  collections,
  favoriteGenre,
  isOwnProfile = false,
}: ProfileHeaderProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const profileImage = resolveProfileImage(user.picture || user.picture_fallback_url);
  const displayName = getProfileDisplayName(user);
  const joinedDate = formatProfileDate(user.created_at ?? user.user.date_joined);
  const covers = recentProfileCovers(collections);
  const primaryCollection = collections?.[0];
  const completionPercent = user.completion_percent;
  const statItems = [
    {
      icon: "book" as const,
      value: stats?.books_read_count ?? user.books_read_count,
      label: "Books read",
    },
    {
      icon: "star" as const,
      value: stats?.reviews_count ?? user.reviews_count,
      label: "Reviews",
    },
    {
      icon: "users" as const,
      value: stats?.followers_count ?? user.followers_count,
      label: "Followers",
    },
    {
      icon: "collection" as const,
      value: stats?.collections_count ?? user.collections_count ?? collections?.length,
      label: "Lists",
    },
  ];
  const canShowImage = Boolean(profileImage) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [profileImage]);

  return (
    <section
      className={`relative isolate overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-panel-strong)_86%,transparent),color-mix(in_srgb,var(--surface-panel)_72%,transparent))] p-4 shadow-lg backdrop-blur sm:p-6 lg:p-8 ${
        center ? "text-center sm:text-left" : ""
      }`}
      aria-labelledby="profile-title"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-accent),transparent)]" />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:items-stretch">
        <div className="flex min-w-0 flex-col gap-6">
          <div className={`flex flex-col gap-5 sm:flex-row sm:items-end ${center ? "items-center" : "items-start"}`}>
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black shadow-xl sm:h-36 sm:w-36">
              {canShowImage ? (
                <img
                  src={profileImage}
                  alt={`${displayName}'s profile image`}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
                  width="144"
                  height="144"
                  loading="lazy"
                  decoding="async"
                  onError={() => setHasImageError(true)}
                />
              ) : (
                <div
                  className="fallback-gradient flex h-full w-full items-center justify-center text-4xl font-bold text-primary-white sm:text-5xl"
                  style={getFallbackHueStyle(displayName)}
                >
                  {getInitials(displayName)}
                </div>
              )}
              {isOwnProfile && completionPercent !== undefined ? (
                <span className="absolute bottom-2 left-2 rounded-lg bg-primary-black/70 px-2 py-1 text-[0.6875rem] font-bold text-accent backdrop-blur">
                  {completionPercent}% complete
                </span>
              ) : null}
            </div>
            <div className={`flex min-w-0 flex-1 flex-col gap-3 ${center ? "items-center sm:items-start" : "items-start"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase text-accent">
                  <ProfileHeaderIcon name="reader" />
                  {profileTypeLabel(user.profile_type)}
                </span>
                {favoriteGenre ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/25 px-3 py-1 text-xs font-semibold text-primary-gray">
                    <ProfileHeaderIcon name="spark" />
                    {favoriteGenre}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <h1
                  id="profile-title"
                  className="break-words font-display text-4xl font-black leading-[0.98] tracking-normal text-primary-white sm:text-5xl lg:text-6xl"
                >
                  {displayName}
                </h1>
                <p className="mt-2 break-all text-sm font-semibold text-primary-gray">
                  @{user.handle}
                </p>
              </div>
              <div className={`flex max-w-full flex-wrap gap-2 ${center ? "justify-center sm:justify-start" : ""}`}>
                {user.location ? <MetaPill icon="pin">{user.location}</MetaPill> : null}
                {joinedDate ? <MetaPill icon="calendar">{`Joined ${joinedDate}`}</MetaPill> : null}
                {primaryCollection ? (
                  <MetaPill icon="collection">
                    {primaryCollection.name}
                  </MetaPill>
                ) : null}
              </div>
              <div className="pt-1">{action}</div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Profile summary">
            {statItems.map((item) => (
              <StatChip
                key={item.label}
                icon={item.icon}
                value={item.value}
                label={item.label}
              />
            ))}
          </div>
        </div>
        <aside
          className="flex min-h-[16rem] flex-col justify-between overflow-hidden rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/30 p-4"
          aria-label="Recent shelf preview"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-accent">
                Recent shelf
              </p>
              <h2 className="truncate text-lg font-bold text-primary-white">
                {primaryCollection?.name ?? "Reading activity"}
              </h2>
            </div>
            <span className="shrink-0 rounded-lg border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
              {formatCompactNumber(primaryCollection?.item_count ?? primaryCollection?.items?.length ?? 0)} books
            </span>
          </div>
          {covers.length > 0 ? (
            <div className="mt-6 grid grid-cols-5 items-end gap-2" aria-hidden="true">
              {covers.map((cover, index) => (
                <div
                  key={`${cover}-${index}`}
                  className={`overflow-hidden rounded-md bg-secondary-black shadow-lg ${
                    index === 0 || index === 4
                      ? "h-24"
                      : index === 2
                        ? "h-36"
                        : "h-[7.5rem]"
                  }`}
                >
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="fallback-gradient mt-6 flex min-h-36 items-center justify-center rounded-lg text-5xl font-black text-primary-white"
              style={getFallbackHueStyle(displayName)}
              aria-hidden="true"
            >
              {getInitials(displayName)}
            </div>
          )}
          <p className="mt-5 text-sm leading-relaxed text-primary-gray">
            {user.bio || "Reading taste, shelves, and reviews will settle here as this profile grows."}
          </p>
        </aside>
      </div>
    </section>
  );
}
