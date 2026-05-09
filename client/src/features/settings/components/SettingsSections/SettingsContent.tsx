import type { FormEvent, ReactElement } from "react";

import type { CatalogGenre } from "../../../catalog/types/book";
import type {
  ProfileInterestSelection,
  UserPreference,
  UserProfile,
} from "../../../profile/types/user";
import type {
  SettingsProfileType,
  SettingsSocialLinkDraft,
} from "../../types/settings";
import { AccountSettings } from "./AccountSettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { SecuritySettingsForm } from "./SecuritySettingsForm";

export interface SettingsContentProps {
  user: UserProfile;
  preferences?: UserPreference | undefined;
  displayName: string;
  handle: string;
  bio: string;
  profileType: SettingsProfileType;
  location: string;
  websiteUrl: string;
  interests: ProfileInterestSelection[];
  genreQuery: string;
  genreOptions: CatalogGenre[];
  isLoadingGenreOptions: boolean;
  socialLinks: SettingsSocialLinkDraft[];
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSavingAccount: boolean;
  isSavingProfile: boolean;
  isSavingPreferences: boolean;
  isChangingPassword: boolean;
  onDisplayNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onProfileTypeChange: (value: SettingsProfileType) => void;
  onLocationChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  onGenreQueryChange: (value: string) => void;
  onAddInterest: (genre: CatalogGenre) => void;
  onRemoveInterest: (genreId: number) => void;
  onInterestWeightChange: (genreId: number, weight: number) => void;
  onAddSocialLink: () => void;
  onRemoveSocialLink: (key: string) => void;
  onSocialLinkChange: (
    key: string,
    field: keyof Omit<SettingsSocialLinkDraft, "key" | "id">,
    value: string
  ) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdateAccount: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePreferences: (payload: Partial<UserPreference>) => void;
}

export function SettingsContent({
  user,
  preferences,
  displayName,
  handle,
  bio,
  profileType,
  location,
  websiteUrl,
  interests,
  genreQuery,
  genreOptions,
  isLoadingGenreOptions,
  socialLinks,
  currentPassword,
  newPassword,
  confirmPassword,
  passwordError,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  isSavingAccount,
  isSavingProfile,
  isSavingPreferences,
  isChangingPassword,
  onDisplayNameChange,
  onHandleChange,
  onBioChange,
  onProfileTypeChange,
  onLocationChange,
  onWebsiteUrlChange,
  onGenreQueryChange,
  onAddInterest,
  onRemoveInterest,
  onInterestWeightChange,
  onAddSocialLink,
  onRemoveSocialLink,
  onSocialLinkChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onUpdateAccount,
  onUpdateInfo,
  onUpdatePassword,
  onUpdatePreferences,
}: SettingsContentProps): ReactElement {
  return (
    <main className="grid min-w-0 gap-5 lg:gap-6">
      <AccountSettings
        user={user}
        displayName={displayName}
        isSavingAccount={isSavingAccount}
        onDisplayNameChange={onDisplayNameChange}
        onUpdateAccount={onUpdateAccount}
      />
      <ProfileSettingsForm
        handle={handle}
        bio={bio}
        profileType={profileType}
        location={location}
        websiteUrl={websiteUrl}
        interests={interests}
        genreQuery={genreQuery}
        genreOptions={genreOptions}
        isLoadingGenreOptions={isLoadingGenreOptions}
        socialLinks={socialLinks}
        isSavingProfile={isSavingProfile}
        onHandleChange={onHandleChange}
        onBioChange={onBioChange}
        onProfileTypeChange={onProfileTypeChange}
        onLocationChange={onLocationChange}
        onWebsiteUrlChange={onWebsiteUrlChange}
        onGenreQueryChange={onGenreQueryChange}
        onAddInterest={onAddInterest}
        onRemoveInterest={onRemoveInterest}
        onInterestWeightChange={onInterestWeightChange}
        onAddSocialLink={onAddSocialLink}
        onRemoveSocialLink={onRemoveSocialLink}
        onSocialLinkChange={onSocialLinkChange}
        onUpdateInfo={onUpdateInfo}
      />
      <PreferencesSettings
        preferences={preferences}
        isSavingPreferences={isSavingPreferences}
        onUpdatePreferences={onUpdatePreferences}
      />
      <SecuritySettingsForm
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        passwordError={passwordError}
        showCurrentPassword={showCurrentPassword}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        isChangingPassword={isChangingPassword}
        onCurrentPasswordChange={onCurrentPasswordChange}
        onNewPasswordChange={onNewPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
        onToggleCurrentPassword={onToggleCurrentPassword}
        onToggleNewPassword={onToggleNewPassword}
        onToggleConfirmPassword={onToggleConfirmPassword}
        onUpdatePassword={onUpdatePassword}
      />
    </main>
  );
}
