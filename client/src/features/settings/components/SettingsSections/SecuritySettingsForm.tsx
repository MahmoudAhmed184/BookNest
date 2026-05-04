import type { FormEvent, ReactElement } from "react";

import { PasswordSettingField } from "./PasswordSettingField";

export interface SecuritySettingsFormProps {
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
}

export function SecuritySettingsForm({
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
}: SecuritySettingsFormProps): ReactElement {
  return (
    <form onSubmit={onUpdatePassword} className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-primary-white">Security Settings</h2>
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
        toggleLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        error={passwordError}
      />
      <button type="submit" className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm">
        Update Password
      </button>
    </form>
  );
}
