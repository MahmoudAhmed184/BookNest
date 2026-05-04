import type { FormEvent, ReactElement } from "react";

import type { UserProfile } from "../../../profile/types/user";
import { AccountSettings } from "./AccountSettings";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { SecuritySettingsForm } from "./SecuritySettingsForm";
import { SettingsTabs, type SettingsTab, type SettingsTabItem } from "./SettingsTabs";

export interface SettingsSidebarProps {
  user: UserProfile;
  activeTab: SettingsTab;
  tabs: SettingsTabItem[];
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

export function SettingsSidebar({
  user,
  activeTab,
  tabs,
  username,
  bio,
  newPassword,
  confirmPassword,
  passwordError,
  showNewPassword,
  showConfirmPassword,
  isSavingProfile,
  onTabChange,
  onLogout,
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
    <aside className="flex flex-col gap-6">
      <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
      <div className="glass-card p-6">
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
      </div>
    </aside>
  );
}
