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
  const profileImage = resolveProfileImage(user.profile_pic);

  return (
    <section className="flex flex-col gap-8" aria-labelledby="settings-profile-title">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
        <label
          htmlFor="profile-picture"
          className="group relative block aspect-square w-64 cursor-pointer overflow-hidden rounded-xl bg-secondary-black shadow-xl focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
        >
          {profileImage ? (
            <img src={profileImage} alt={`${user.username}'s profile`} className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]" width="256" height="256" loading="lazy" decoding="async" />
          ) : (
            <div className="fallback-gradient flex h-full w-full items-center justify-center text-5xl font-bold text-primary-white" style={getFallbackHueStyle(user.username)}>
              {getInitials(user.username)}
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-primary-black/70 text-sm font-medium text-primary-white opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
            {isUploading ? "Uploading..." : "Change Picture"}
          </span>
          <input id="profile-picture" type="file" accept="image/jpg, image/jpeg, image/png, image/gif, image/webp" onChange={onFileChange} className="sr-only" disabled={isUploading} />
        </label>
        <div className="flex flex-col gap-3 text-center md:text-left">
          <h2 id="settings-profile-title" className="text-2xl font-bold text-primary-white">{user.username}</h2>
          <p className="text-sm text-primary-gray">@{user.username}</p>
          <p className="text-sm text-primary-gray">Member since {user.created_at || "Unknown"}</p>
          {selectedFile ? <p className="text-xs text-primary-gray">Selected: {selectedFile.name}</p> : null}
          <button type="button" className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm" onClick={onEditProfile}>
            Edit Profile
          </button>
        </div>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="settings-bio-title">
        <h2 id="settings-bio-title" className="text-xl font-bold text-primary-white">Bio</h2>
        <p className="glass-card max-w-2xl p-5 text-base leading-relaxed text-primary-white">{user.bio || "No bio added yet."}</p>
      </section>
    </section>
  );
}
