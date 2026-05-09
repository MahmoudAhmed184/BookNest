import type { ReactElement } from "react";

import { ToggleSwitch } from "../../../../components/ui";
import type { UserPreference } from "../../../profile/types/user";

export interface PreferencesSettingsProps {
  preferences?: UserPreference | undefined;
  isSavingPreferences: boolean;
  onUpdatePreferences: (payload: Partial<UserPreference>) => void;
}

interface PreferenceGroup {
  title: string;
  description: string;
  items: PreferenceToggleItem[];
}

interface PreferenceToggleItem {
  key: keyof Pick<
    UserPreference,
    | "email_notifications_enabled"
    | "in_app_notifications_enabled"
    | "notify_on_follow"
    | "notify_on_review_vote"
    | "profile_public"
    | "show_ratings_publicly"
    | "personalized_recommendations_enabled"
    | "external_enrichment_enabled"
    | "search_history_enabled"
    | "mature_content_enabled"
  >;
  label: string;
  description: string;
}

const preferenceGroups: PreferenceGroup[] = [
  {
    title: "Notifications",
    description: "Control how BookNest sends account and community updates.",
    items: [
      {
        key: "email_notifications_enabled",
        label: "Email notifications",
        description: "Receive important account and library updates by email.",
      },
      {
        key: "in_app_notifications_enabled",
        label: "In-app notifications",
        description: "Show follows, review votes, and recommendations in BookNest.",
      },
      {
        key: "notify_on_follow",
        label: "New followers",
        description: "Let BookNest notify you when another reader follows you.",
      },
      {
        key: "notify_on_review_vote",
        label: "Review votes",
        description: "Show activity when readers react to your reviews.",
      },
    ],
  },
  {
    title: "Privacy",
    description: "Choose what other readers can see on your profile.",
    items: [
      {
        key: "profile_public",
        label: "Public profile",
        description: "Let other readers browse your profile and shelves.",
      },
      {
        key: "show_ratings_publicly",
        label: "Public ratings",
        description: "Show your ratings on profile and activity surfaces.",
      },
    ],
  },
  {
    title: "Discovery",
    description: "Tune personalization and catalog enrichment signals.",
    items: [
      {
        key: "personalized_recommendations_enabled",
        label: "Personalized recommendations",
        description: "Use your reading signals to rank recommendations.",
      },
      {
        key: "external_enrichment_enabled",
        label: "Catalog enrichment",
        description: "Allow external catalog lookups when local results are thin.",
      },
      {
        key: "search_history_enabled",
        label: "Search history",
        description: "Use recent searches to improve discovery shortcuts.",
      },
      {
        key: "mature_content_enabled",
        label: "Mature content",
        description: "Include mature catalog entries in eligible discovery results.",
      },
    ],
  },
];

const timezoneOptions = [
  "UTC",
  "Africa/Cairo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
];

export function PreferencesSettings({
  preferences,
  isSavingPreferences,
  onUpdatePreferences,
}: PreferencesSettingsProps): ReactElement {
  const availableTimezones =
    preferences && !timezoneOptions.includes(preferences.timezone)
      ? [preferences.timezone, ...timezoneOptions]
      : timezoneOptions;

  return (
    <section
      id="settings-preferences"
      className="settings-panel scroll-mt-28 p-5 sm:p-6"
      aria-labelledby="preferences-settings-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Preferences</p>
          <h2 id="preferences-settings-title" className="mt-1 text-2xl font-bold text-primary-white">
            Privacy and discovery
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-gray">
            Make focused changes without leaving the settings page.
          </p>
        </div>
        {isSavingPreferences ? (
          <span className="w-fit rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
            Saving
          </span>
        ) : null}
      </div>

      {preferences ? (
        <div className="mt-6 grid gap-4">
          {preferenceGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-lg border border-[var(--surface-glass-border)]"
              aria-labelledby={`settings-${group.title.toLowerCase()}-title`}
            >
              <div className="border-b border-[var(--surface-glass-border)] px-4 py-3">
                <h3
                  id={`settings-${group.title.toLowerCase()}-title`}
                  className="text-base font-bold text-primary-white"
                >
                  {group.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-primary-gray">
                  {group.description}
                </p>
              </div>
              <div className="divide-y divide-[var(--surface-glass-border)]">
                {group.items.map((item) => (
                  <ToggleSwitch
                    key={item.key}
                    checked={Boolean(preferences[item.key])}
                    label={item.label}
                    description={item.description}
                    className="rounded-none bg-transparent px-4"
                    disabled={isSavingPreferences}
                    onChange={(checked) => onUpdatePreferences({ [item.key]: checked })}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="grid gap-4 rounded-lg border border-[var(--surface-glass-border)] p-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="settings-default-privacy"
                className="mb-2 block text-sm font-semibold text-primary-gray"
              >
                Default collection privacy
              </label>
              <select
                id="settings-default-privacy"
                value={preferences.default_collection_privacy}
                className="field w-full text-primary-white"
                disabled={isSavingPreferences}
                onChange={(event) =>
                  onUpdatePreferences({
                    default_collection_privacy: event.currentTarget
                      .value as UserPreference["default_collection_privacy"],
                  })
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="settings-timezone"
                className="mb-2 block text-sm font-semibold text-primary-gray"
              >
                Timezone
              </label>
              <select
                id="settings-timezone"
                value={preferences.timezone}
                className="field w-full text-primary-white"
                disabled={isSavingPreferences}
                onChange={(event) =>
                  onUpdatePreferences({ timezone: event.currentTarget.value })
                }
              >
                {availableTimezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-[var(--surface-glass-border)] p-4 text-sm text-primary-gray">
          Preferences are not available for this account yet.
        </p>
      )}
    </section>
  );
}
