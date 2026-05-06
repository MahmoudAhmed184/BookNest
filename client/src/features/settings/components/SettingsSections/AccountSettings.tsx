import { useState, type ReactElement } from "react";

import { ToggleSwitch } from "../../../../components/ui";
import type { UserProfile } from "../../../profile/types/user";

export interface AccountSettingsProps {
  user: UserProfile;
}

export function AccountSettings({ user }: AccountSettingsProps): ReactElement {
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [publicShelf, setPublicShelf] = useState(user.profile_type !== "private");

  return (
    <section className="flex flex-col gap-6" aria-labelledby="account-settings-title">
      <div>
        <h2 id="account-settings-title" className="text-xl font-bold text-primary-white">
          Account
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-primary-gray">
          Your sign-in identity and reader preferences.
        </p>
      </div>
      <dl className="divide-y divide-[var(--surface-glass-border)] rounded-xl border border-[var(--surface-glass-border)] text-sm">
        <div className="grid gap-1 px-4 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
          <dt className="font-medium text-primary-gray">Username</dt>
          <dd className="min-w-0 font-semibold text-primary-white">{user.username}</dd>
        </div>
        <div className="grid gap-1 px-4 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
          <dt className="font-medium text-primary-gray">Email</dt>
          <dd className="min-w-0 break-all font-semibold text-primary-white">
            {user.email || "Not provided"}
          </dd>
        </div>
      </dl>
      <section className="flex flex-col gap-3" aria-labelledby="preferences-title">
        <h3 id="preferences-title" className="text-sm font-bold uppercase text-primary-gray">
          Preferences
        </h3>
        <div className="divide-y divide-[var(--surface-glass-border)] rounded-xl border border-[var(--surface-glass-border)]">
          <ToggleSwitch
            checked={weeklyDigest}
            label="Weekly reading digest"
            description="Receive a concise summary of shelf activity."
            className="rounded-b-none !bg-transparent !px-4"
            onChange={setWeeklyDigest}
          />
          <ToggleSwitch
            checked={publicShelf}
            label="Public shelf"
            description="Let other readers browse your profile shelves."
            className="rounded-t-none !bg-transparent !px-4"
            onChange={setPublicShelf}
          />
        </div>
      </section>
    </section>
  );
}
