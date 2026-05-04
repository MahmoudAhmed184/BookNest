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
    <section className="flex flex-col gap-5" aria-labelledby="account-settings-title">
      <h2 id="account-settings-title" className="text-lg font-bold text-primary-white">
        Account Settings
      </h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="rounded-xl bg-primary-black p-4">
          <dt className="text-primary-gray">Username</dt>
          <dd className="mt-1 font-medium text-primary-white">{user.username}</dd>
        </div>
        <div className="rounded-xl bg-primary-black p-4">
          <dt className="text-primary-gray">Email</dt>
          <dd className="mt-1 font-medium text-primary-white">{user.email || "Not provided"}</dd>
        </div>
      </dl>
      <section className="flex flex-col gap-3" aria-labelledby="preferences-title">
        <h3 id="preferences-title" className="text-sm font-bold uppercase text-primary-gray">
          Preferences
        </h3>
        <ToggleSwitch
          checked={weeklyDigest}
          label="Weekly reading digest"
          description="Receive a concise summary of shelf activity."
          onChange={setWeeklyDigest}
        />
        <ToggleSwitch
          checked={publicShelf}
          label="Public shelf"
          description="Let other readers browse your profile shelves."
          onChange={setPublicShelf}
        />
      </section>
    </section>
  );
}
