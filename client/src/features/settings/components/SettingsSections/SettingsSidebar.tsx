import type { FormEvent, ReactElement } from "react";

import type { UserProfile } from "../../../profile/types/user";
import { AccountSettings } from "./AccountSettings";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { SecuritySettingsForm } from "./SecuritySettingsForm";
import type { SettingsTab } from "./SettingsTabs";

export interface SettingsSidebarProps {
  user: UserProfile;
  activeTab: SettingsTab;
  username: string;
  bio: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSavingProfile: boolean;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
}

export function SettingsSidebar({
  user,
  activeTab,
  username,
  bio,
  newPassword,
  confirmPassword,
  passwordError,
  showNewPassword,
  showConfirmPassword,
  isSavingProfile,
  onUsernameChange,
  onBioChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onUpdateInfo,
  onUpdatePassword,
}: SettingsSidebarProps): ReactElement {
  return (
    <section className="settings-panel p-5 sm:p-6">
      {activeTab === "account" ? <AccountSettings user={user} /> : null}
      {activeTab === "profile" ? (
        <ProfileSettingsForm
          username={username}
          bio={bio}
          isSavingProfile={isSavingProfile}
          onUsernameChange={onUsernameChange}
          onBioChange={onBioChange}
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
