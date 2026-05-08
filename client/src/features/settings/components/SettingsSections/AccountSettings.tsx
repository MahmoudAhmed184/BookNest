import type { ReactElement } from "react";

import { ToggleSwitch } from "../../../../components/ui";
import type { UserPreference, UserProfile } from "../../../profile/types/user";

export interface AccountSettingsProps {
  user: UserProfile;
  preferences?: UserPreference | undefined;
  isSavingPreferences: boolean;
  onUpdatePreferences: (payload: Partial<UserPreference>) => void;
}

export function AccountSettings({
  user,
  preferences,
  isSavingPreferences,
  onUpdatePreferences,
}: AccountSettingsProps): ReactElement {
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
          <dt className="font-medium text-primary-gray">Handle</dt>
          <dd className="min-w-0 font-semibold text-primary-white">@{user.handle}</dd>
        </div>
        <div className="grid gap-1 px-4 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
          <dt className="font-medium text-primary-gray">Email</dt>
          <dd className="min-w-0 break-all font-semibold text-primary-white">
            {user.user.email || "Not provided"}
          </dd>
        </div>
      </dl>
      {preferences ? (
        <section className="flex flex-col gap-3" aria-labelledby="preferences-title">
          <h3 id="preferences-title" className="text-sm font-bold uppercase text-primary-gray">
            Preferences
          </h3>
          <div className="divide-y divide-[var(--surface-glass-border)] rounded-xl border border-[var(--surface-glass-border)]">
            <ToggleSwitch
              checked={preferences.email_notifications_enabled}
              label="Email notifications"
              description="Receive important BookNest updates by email."
              className="rounded-b-none !bg-transparent !px-4"
              disabled={isSavingPreferences}
              onChange={(checked) =>
                onUpdatePreferences({ email_notifications_enabled: checked })
              }
            />
            <ToggleSwitch
              checked={preferences.in_app_notifications_enabled}
              label="In-app notifications"
              description="Show follows, review votes, and recommendations in BookNest."
              className="!bg-transparent !px-4"
              disabled={isSavingPreferences}
              onChange={(checked) =>
                onUpdatePreferences({ in_app_notifications_enabled: checked })
              }
            />
            <ToggleSwitch
              checked={preferences.profile_public}
              label="Public profile"
              description="Let other readers browse your profile."
              className="!bg-transparent !px-4"
              disabled={isSavingPreferences}
              onChange={(checked) => onUpdatePreferences({ profile_public: checked })}
            />
            <ToggleSwitch
              checked={preferences.personalized_recommendations_enabled}
              label="Personalized recommendations"
              description="Use your reading signals to rank recommendations."
              className="rounded-t-none !bg-transparent !px-4"
              disabled={isSavingPreferences}
              onChange={(checked) =>
                onUpdatePreferences({
                  personalized_recommendations_enabled: checked,
                })
              }
            />
          </div>
        </section>
      ) : null}
    </section>
  );
}
