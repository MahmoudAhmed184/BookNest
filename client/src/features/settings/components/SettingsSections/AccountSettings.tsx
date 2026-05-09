import type { FormEvent, ReactElement } from "react";

import { InlineSpinner } from "../../../../components/ui";
import type { UserProfile } from "../../../profile/types/user";

export interface AccountSettingsProps {
  user: UserProfile;
  displayName: string;
  isSavingAccount: boolean;
  onDisplayNameChange: (value: string) => void;
  onUpdateAccount: (event: FormEvent<HTMLFormElement>) => void;
}

export function AccountSettings({
  user,
  displayName,
  isSavingAccount,
  onDisplayNameChange,
  onUpdateAccount,
}: AccountSettingsProps): ReactElement {
  const email = user.user.email || "Not provided";
  const memberSince = formatMemberSince(user.user.date_joined ?? user.created_at);

  return (
    <section
      id="settings-account"
      className="settings-panel scroll-mt-28 p-5 sm:p-6"
      aria-labelledby="account-settings-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Account</p>
          <h2 id="account-settings-title" className="mt-1 text-2xl font-bold text-primary-white">
            Account details
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-gray">
            Keep the identity connected to your BookNest account up to date.
          </p>
        </div>
        <span className="w-fit rounded-full border border-[var(--surface-glass-border)] px-3 py-1 text-xs font-semibold text-primary-gray">
          {memberSince}
        </span>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={onUpdateAccount}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="settings-display-name"
              className="mb-2 block text-sm font-semibold text-primary-gray"
            >
              Display name
            </label>
            <input
              id="settings-display-name"
              type="text"
              value={displayName}
              onChange={(event) => onDisplayNameChange(event.target.value)}
              className="field w-full text-primary-white"
              autoComplete="name"
              maxLength={150}
            />
          </div>
          <div>
            <label
              htmlFor="settings-email"
              className="mb-2 block text-sm font-semibold text-primary-gray"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              className="field w-full text-primary-gray"
              autoComplete="email"
              readOnly
            />
          </div>
        </div>

        <dl className="grid gap-3 rounded-lg border border-[var(--surface-glass-border)] p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-primary-gray">Handle</dt>
            <dd className="mt-1 truncate font-semibold text-primary-white">@{user.handle}</dd>
          </div>
          <div>
            <dt className="text-primary-gray">User ID</dt>
            <dd className="mt-1 font-semibold text-primary-white">{user.user.id}</dd>
          </div>
          <div>
            <dt className="text-primary-gray">Email status</dt>
            <dd className="mt-1 font-semibold text-primary-white">
              {user.user.email_verified_at ? "Verified" : "Unverified"}
            </dd>
          </div>
        </dl>

        <button
          type="submit"
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-5 py-2 text-sm"
          disabled={isSavingAccount}
        >
          {isSavingAccount ? <InlineSpinner /> : null}
          {isSavingAccount ? "Saving..." : "Save account"}
        </button>
      </form>
    </section>
  );
}

function formatMemberSince(value?: string | null): string {
  if (!value) return "Member since unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Member since unknown";

  return `Member since ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date)}`;
}
