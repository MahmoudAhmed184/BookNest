import type { ChangeEvent, ReactElement } from "react";
import { Link } from "react-router-dom";

import { routeBuilders } from "../../../../routes/paths";
import type { UserPreference, UserProfile } from "../../../profile/types/user";
import {
  formatCompactNumber,
  getFallbackHueStyle,
  getInitials,
  resolveProfileImage,
} from "../../../profile/utils/profileDisplay";

export interface SettingsProfileOverviewProps {
  user: UserProfile;
  preferences?: UserPreference | undefined;
  selectedFile: File | null;
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsProfileOverview({
  user,
  preferences,
  selectedFile,
  isUploading,
  onFileChange,
}: SettingsProfileOverviewProps): ReactElement {
  const profileImage = resolveProfileImage(user.picture || user.picture_fallback_url);
  const displayName = user.user.display_name?.trim() || user.handle;
  const completion = Math.max(0, Math.min(user.completion_percent ?? 0, 100));
  const profileVisibility = preferences?.profile_public ? "Public profile" : "Private profile";

  return (
    <section
      className="settings-panel overflow-hidden"
      aria-labelledby="settings-profile-overview-title"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <label
              htmlFor="profile-picture"
              className="group relative block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-secondary-black shadow-lg focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${displayName}'s profile`}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="fallback-gradient flex h-full w-full items-center justify-center text-3xl font-bold text-primary-white"
                  style={getFallbackHueStyle(displayName)}
                >
                  {getInitials(displayName)}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-primary-black/75 px-3 text-center text-xs font-semibold text-primary-white opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
                {isUploading ? "Uploading..." : "Change photo"}
              </span>
              <input
                id="profile-picture"
                type="file"
                accept="image/jpg, image/jpeg, image/png, image/gif, image/webp"
                onChange={onFileChange}
                className="sr-only"
                disabled={isUploading}
              />
            </label>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase text-accent">Signed in as</p>
              <h2
                id="settings-profile-overview-title"
                className="mt-1 truncate text-3xl font-bold text-primary-white"
              >
                {displayName}
              </h2>
              <p className="truncate text-sm font-semibold text-primary-gray">@{user.handle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
                  {profileVisibility}
                </span>
                <span className="rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
                  {user.profile_type ?? "reader"}
                </span>
                {selectedFile ? (
                  <span className="max-w-full truncate rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
                    {selectedFile.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-primary-white">Profile completion</span>
              <span className="font-semibold text-primary-gray">{completion}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-black">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--surface-glass-border)] p-5 lg:border-l lg:border-t-0 sm:p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <ProfileStat label="Followers" value={formatCompactNumber(user.followers_count)} />
            <ProfileStat label="Following" value={formatCompactNumber(user.following_count)} />
            <ProfileStat label="Reviews" value={formatCompactNumber(user.reviews_count)} />
            <ProfileStat label="Books read" value={formatCompactNumber(user.books_read_count)} />
          </dl>
          <Link
            to={routeBuilders.userProfile(user.user.id)}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--surface-glass-border)] px-4 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent"
          >
            View public profile
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="rounded-lg border border-[var(--surface-glass-border)] p-3">
      <dt className="text-xs font-semibold text-primary-gray">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-primary-white">{value}</dd>
    </div>
  );
}
