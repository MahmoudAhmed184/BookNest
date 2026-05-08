import type { ChangeEvent, ReactElement } from "react";

import type { UserProfile } from "../../../profile/types/user";
import {
  getFallbackHueStyle,
  getInitials,
  resolveProfileImage,
} from "../../../profile/utils/profileDisplay";

export interface SettingsProfileOverviewProps {
  user: UserProfile;
  selectedFile: File | null;
  isUploading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEditProfile: () => void;
}

export function SettingsProfileOverview({
  user,
  selectedFile,
  isUploading,
  onFileChange,
  onEditProfile,
}: SettingsProfileOverviewProps): ReactElement {
  const profileImage = resolveProfileImage(user.picture || user.picture_fallback_url);
  const memberSince = formatMemberSince(user.created_at);
  const displayName = user.user.display_name || user.handle;

  return (
    <section className="settings-panel p-4 sm:p-6" aria-labelledby="settings-profile-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <label
            htmlFor="profile-picture"
            className="group relative block h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-secondary-black shadow-lg focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2 sm:h-24 sm:w-24"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${displayName}'s profile`}
                className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                width="80"
                height="80"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="fallback-gradient flex h-full w-full items-center justify-center text-2xl font-bold text-primary-white"
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
          <div className="min-w-0">
            <h2
              id="settings-profile-title"
              className="truncate text-2xl font-bold text-primary-white"
            >
              {displayName}
            </h2>
            <p className="truncate text-sm text-primary-gray">@{user.handle}</p>
            <p className="text-sm text-primary-gray">{memberSince}</p>
            {selectedFile ? (
              <p className="mt-2 max-w-full truncate text-xs text-primary-gray">
                Selected: {selectedFile.name}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center self-start px-5 py-2 text-sm sm:self-center"
          onClick={onEditProfile}
        >
          Edit profile
        </button>
      </div>
      <section
        className="mt-5 border-t border-[var(--surface-glass-border)] pt-5"
        aria-labelledby="settings-bio-title"
      >
        <h3 id="settings-bio-title" className="text-sm font-bold uppercase text-primary-gray">
          Bio
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-primary-white">
          {user.bio || "No bio added yet."}
        </p>
      </section>
    </section>
  );
}

function formatMemberSince(value?: string | null): string {
  if (!value) return "Member since unknown";

  const date = new Date(value.replace(" at ", " "));
  if (Number.isNaN(date.getTime())) return `Member since ${value}`;

  return `Member since ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}
