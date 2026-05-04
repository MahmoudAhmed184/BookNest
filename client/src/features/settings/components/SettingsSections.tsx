import type {
  ChangeEvent,
  FormEvent,
  ReactElement,
} from "react";

import { FieldError, InlineSpinner } from "../../../components/ui";
import type { UserProfile } from "../../profile/types/user";
import { getInitials, resolveProfileImage } from "../../profile/components/ProfileSections";

export type SettingsTab = "account" | "profile" | "security";

export function SettingsSkeleton(): ReactElement {
  return (
    <div className="py-12 flex flex-col gap-8 animate-fade-up" role="status" aria-live="polite">
      <div className="h-10 w-48 rounded-full animate-shimmer" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="h-64 w-64 rounded-xl animate-shimmer" />
          <div className="h-28 rounded-xl animate-shimmer" />
        </div>
        <div className="h-80 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

export function PasswordIcon(): ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

interface SettingsProfileOverviewProps {
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
          className="group relative block w-64 aspect-square cursor-pointer overflow-hidden rounded-xl bg-secondary-black shadow-xl focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${user.username}'s profile`}
              className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
              width="256"
              height="256"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-primary-white">
              {getInitials(user.username)}
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-primary-black/70 text-sm font-medium text-primary-white opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
            {isUploading ? "Uploading..." : "Change Picture"}
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
        <div className="flex flex-col gap-3 text-center md:text-left">
          <h2 id="settings-profile-title" className="text-2xl font-semibold text-primary-white">
            {user.username}
          </h2>
          <p className="text-sm text-primary-gray">@{user.username}</p>
          <p className="text-sm text-primary-gray">
            Member since {user.created_at || "Unknown"}
          </p>
          {selectedFile ? (
            <p className="text-xs text-primary-gray">
              Selected: {selectedFile.name}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm"
            onClick={onEditProfile}
          >
            Edit Profile
          </button>
        </div>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="settings-bio-title">
        <h2 id="settings-bio-title" className="text-xl font-semibold text-primary-white">
          Bio
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-primary-white">
          {user.bio || "No bio added yet."}
        </p>
      </section>
    </section>
  );
}

interface SettingsSidebarProps {
  user: UserProfile;
  activeTab: SettingsTab;
  tabs: Array<{ id: SettingsTab; label: string }>;
  username: string;
  bio: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSavingProfile: boolean;
  onTabChange: (tab: SettingsTab) => void;
  onLogout: () => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
}

export function SettingsSidebar(props: SettingsSidebarProps): ReactElement {
  return (
    <aside className="flex flex-col gap-6">
      <SettingsTabs
        tabs={props.tabs}
        activeTab={props.activeTab}
        onTabChange={props.onTabChange}
        onLogout={props.onLogout}
      />
      <div className="rounded-xl bg-secondary-black p-6 shadow-md">
        {props.activeTab === "account" ? <AccountSettings user={props.user} /> : null}
        {props.activeTab === "profile" ? <ProfileSettingsForm {...props} /> : null}
        {props.activeTab === "security" ? <SecuritySettingsForm {...props} /> : null}
      </div>
    </aside>
  );
}

interface SettingsTabsProps {
  tabs: Array<{ id: SettingsTab; label: string }>;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onLogout: () => void;
}

function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
  onLogout,
}: SettingsTabsProps): ReactElement {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-black p-4 shadow-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium transition-all duration-200 ease-out ${
            activeTab === tab.id
              ? "btn-accent-v text-primary-white shadow-md"
              : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
          }`}
          aria-pressed={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium text-primary-gray hover:bg-primary-black hover:text-primary-white"
      >
        Logout
      </button>
    </div>
  );
}

interface AccountSettingsProps {
  user: UserProfile;
}

function AccountSettings({ user }: AccountSettingsProps): ReactElement {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="account-settings-title">
      <h2 id="account-settings-title" className="text-lg font-semibold text-primary-white">
        Account Settings
      </h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="rounded-xl bg-primary-black p-4">
          <dt className="text-primary-gray">Username</dt>
          <dd className="mt-1 font-medium text-primary-white">{user.username}</dd>
        </div>
        <div className="rounded-xl bg-primary-black p-4">
          <dt className="text-primary-gray">Email</dt>
          <dd className="mt-1 font-medium text-primary-white">
            {user.email || "Not provided"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ProfileSettingsForm({
  username,
  bio,
  isSavingProfile,
  onUsernameChange,
  onBioChange,
  onUpdateInfo,
}: SettingsSidebarProps): ReactElement {
  return (
    <form onSubmit={onUpdateInfo} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">Profile Settings</h2>
      <div>
        <label htmlFor="username" className="mb-2 block text-sm text-primary-gray">
          Username <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          className={`w-full min-h-[44px] rounded-lg bg-secondary-gray px-3 py-2 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black ${
            !username.trim() ? "border border-accent" : ""
          }`}
          autoComplete="username"
          aria-invalid={!username.trim()}
          aria-describedby="settings-username-error"
        />
        <div id="settings-username-error">
          <FieldError message={!username.trim() ? "Username is required" : undefined} />
        </div>
      </div>
      <div>
        <label htmlFor="bio" className="mb-2 block text-sm text-primary-gray">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => onBioChange(event.target.value)}
          className="w-full rounded-lg bg-secondary-gray px-3 py-2 text-primary-white outline-hidden resize-y focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
          rows={5}
          placeholder="Tell us about yourself..."
        />
      </div>
      <button
        type="submit"
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm"
        disabled={isSavingProfile || !username.trim()}
      >
        {isSavingProfile ? <InlineSpinner /> : null}
        {isSavingProfile ? "Updating..." : "Update Info"}
      </button>
    </form>
  );
}

function SecuritySettingsForm({
  newPassword,
  confirmPassword,
  passwordError,
  showNewPassword,
  showConfirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onUpdatePassword,
}: SettingsSidebarProps): ReactElement {
  return (
    <form onSubmit={onUpdatePassword} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary-white">Security Settings</h2>
      <PasswordSettingField
        id="settings-new-password"
        label="New password"
        value={newPassword}
        isVisible={showNewPassword}
        onChange={onNewPasswordChange}
        onToggle={onToggleNewPassword}
        toggleLabel={showNewPassword ? "Hide new password" : "Show new password"}
      />
      <PasswordSettingField
        id="settings-confirm-password"
        label="Confirm password"
        value={confirmPassword}
        isVisible={showConfirmPassword}
        onChange={onConfirmPasswordChange}
        onToggle={onToggleConfirmPassword}
        toggleLabel={
          showConfirmPassword ? "Hide confirm password" : "Show confirm password"
        }
        error={passwordError}
      />
      <button
        type="submit"
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm"
      >
        Update Password
      </button>
    </form>
  );
}

interface PasswordSettingFieldProps {
  id: string;
  label: string;
  value: string;
  isVisible: boolean;
  toggleLabel: string;
  error?: string | undefined;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordSettingField({
  id,
  label,
  value,
  isVisible,
  toggleLabel,
  error,
  onChange,
  onToggle,
}: PasswordSettingFieldProps): ReactElement {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-primary-gray">
        {label} <span aria-hidden="true" className="text-accent">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-h-[44px] rounded-lg bg-secondary-gray px-3 py-2 pr-12 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
          autoComplete="new-password"
          aria-describedby={error ? "settings-password-error" : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
          aria-label={toggleLabel}
        >
          <PasswordIcon />
        </button>
      </div>
      {error ? (
        <div id="settings-password-error">
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}
