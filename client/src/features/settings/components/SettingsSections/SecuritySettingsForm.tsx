import type { FormEvent, ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import { PasswordSettingField } from "./PasswordSettingField";

export interface SecuritySettingsFormProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isChangingPassword: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
}

export function SecuritySettingsForm({
  currentPassword,
  newPassword,
  confirmPassword,
  passwordError,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  isChangingPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onUpdatePassword,
}: SecuritySettingsFormProps): ReactElement {
  return (
    <section
      id="settings-security"
      className="settings-panel scroll-mt-28 p-5 sm:p-6"
      aria-labelledby="security-settings-title"
    >
      <form onSubmit={onUpdatePassword} className="grid gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">Security</p>
            <h2 id="security-settings-title" className="mt-1 text-2xl font-bold text-primary-white">
              Password access
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-gray">
              Use your current password before setting a new one.
            </p>
          </div>
          <span className="w-fit rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
            Current password required
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <PasswordSettingField
            id="settings-current-password"
            label="Current password"
            value={currentPassword}
            isVisible={showCurrentPassword}
            autoComplete="current-password"
            onChange={onCurrentPasswordChange}
            onToggle={onToggleCurrentPassword}
            toggleLabel={showCurrentPassword ? "Hide current password" : "Show current password"}
            error={passwordError && !currentPassword.trim() ? passwordError : undefined}
          />
          <PasswordSettingField
            id="settings-new-password"
            label="New password"
            value={newPassword}
            isVisible={showNewPassword}
            autoComplete="new-password"
            onChange={onNewPasswordChange}
            onToggle={onToggleNewPassword}
            toggleLabel={showNewPassword ? "Hide new password" : "Show new password"}
            error={
              passwordError && currentPassword.trim() && newPassword.length < 8
                ? passwordError
                : undefined
            }
          />
          <PasswordSettingField
            id="settings-confirm-password"
            label="Confirm password"
            value={confirmPassword}
            isVisible={showConfirmPassword}
            autoComplete="new-password"
            onChange={onConfirmPasswordChange}
            onToggle={onToggleConfirmPassword}
            toggleLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            error={
              passwordError &&
              currentPassword.trim() &&
              newPassword.length >= 8
                ? passwordError
                : undefined
            }
          />
        </div>
        <button
          type="submit"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-5 py-2 text-sm"
          disabled={isChangingPassword}
        >
          {isChangingPassword ? <InlineSpinner /> : null}
          {isChangingPassword ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}
