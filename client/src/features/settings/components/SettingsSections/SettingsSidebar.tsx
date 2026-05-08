import type { FormEvent, ReactElement } from "react";

import type { CatalogGenre } from "../../../catalog/types/book";
import type {
  ProfileInterestSelection,
  UserPreference,
  UserProfile,
} from "../../../profile/types/user";
import { AccountSettings } from "./AccountSettings";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { SecuritySettingsForm } from "./SecuritySettingsForm";
import type { SettingsTab } from "./SettingsTabs";

export interface SettingsSidebarProps {
  user: UserProfile;
  preferences?: UserPreference | undefined;
  activeTab: SettingsTab;
  username: string;
  bio: string;
  profileType: string;
  interests: ProfileInterestSelection[];
  genreQuery: string;
  genreOptions: CatalogGenre[];
  isLoadingGenreOptions: boolean;
  socialLinksText: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSavingProfile: boolean;
  isSavingPreferences: boolean;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onProfileTypeChange: (value: string) => void;
  onGenreQueryChange: (value: string) => void;
  onAddInterest: (genre: CatalogGenre) => void;
  onRemoveInterest: (genreId: number) => void;
  onInterestWeightChange: (genreId: number, weight: number) => void;
  onSocialLinksTextChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePreferences: (payload: Partial<UserPreference>) => void;
}

export function SettingsSidebar({
  user,
  preferences,
  activeTab,
  username,
  bio,
  profileType,
  interests,
  genreQuery,
  genreOptions,
  isLoadingGenreOptions,
  socialLinksText,
  newPassword,
  confirmPassword,
  passwordError,
  showNewPassword,
  showConfirmPassword,
  isSavingProfile,
  isSavingPreferences,
  onUsernameChange,
  onBioChange,
  onProfileTypeChange,
  onGenreQueryChange,
  onAddInterest,
  onRemoveInterest,
  onInterestWeightChange,
  onSocialLinksTextChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onUpdateInfo,
  onUpdatePassword,
  onUpdatePreferences,
}: SettingsSidebarProps): ReactElement {
  return (
    <section className="settings-panel p-5 sm:p-6">
      {activeTab === "account" ? (
        <AccountSettings
          user={user}
          preferences={preferences}
          isSavingPreferences={isSavingPreferences}
          onUpdatePreferences={onUpdatePreferences}
        />
      ) : null}
      {activeTab === "profile" ? (
        <ProfileSettingsForm
          username={username}
          bio={bio}
          profileType={profileType}
          interests={interests}
          genreQuery={genreQuery}
          genreOptions={genreOptions}
          isLoadingGenreOptions={isLoadingGenreOptions}
          socialLinksText={socialLinksText}
          isSavingProfile={isSavingProfile}
          onUsernameChange={onUsernameChange}
          onBioChange={onBioChange}
          onProfileTypeChange={onProfileTypeChange}
          onGenreQueryChange={onGenreQueryChange}
          onAddInterest={onAddInterest}
          onRemoveInterest={onRemoveInterest}
          onInterestWeightChange={onInterestWeightChange}
          onSocialLinksTextChange={onSocialLinksTextChange}
          onUpdateInfo={onUpdateInfo}
        />
      ) : null}
      {activeTab === "security" ? (
        <SecuritySettingsForm
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          onNewPasswordChange={onNewPasswordChange}
          onConfirmPasswordChange={onConfirmPasswordChange}
          onToggleNewPassword={onToggleNewPassword}
          onToggleConfirmPassword={onToggleConfirmPassword}
          onUpdatePassword={onUpdatePassword}
        />
      ) : null}
    </section>
  );
}
