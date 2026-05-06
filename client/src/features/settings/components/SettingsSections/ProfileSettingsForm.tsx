import type { FormEvent, ReactElement } from "react";

import { FieldError, InlineSpinner } from "../../../../components/ui";

export interface ProfileSettingsFormProps {
  username: string;
  bio: string;
  isSavingProfile: boolean;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
}

export function ProfileSettingsForm({
  username,
  bio,
  isSavingProfile,
  onUsernameChange,
  onBioChange,
  onUpdateInfo,
}: ProfileSettingsFormProps): ReactElement {
  const hasUsernameError = !username.trim();

  return (
    <form onSubmit={onUpdateInfo} className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-primary-white">Profile</h2>
        <p className="mt-1 text-sm leading-relaxed text-primary-gray">
          Update the public details shown on your reader profile.
        </p>
      </div>
      <div className="grid gap-5">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-primary-gray">
            Username <span aria-hidden="true" className="text-accent">*</span>
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className={`field w-full text-primary-white ${hasUsernameError ? "border-accent" : ""}`}
            autoComplete="username"
            aria-invalid={hasUsernameError}
            aria-describedby={hasUsernameError ? "settings-username-error" : undefined}
          />
          <div id="settings-username-error">
            <FieldError message={hasUsernameError ? "Username is required" : undefined} />
          </div>
        </div>
        <div>
          <label htmlFor="bio" className="mb-2 block text-sm font-medium text-primary-gray">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            className="field min-h-32 w-full resize-y text-primary-white"
            rows={5}
            aria-describedby="settings-bio-help"
          />
          <p id="settings-bio-help" className="mt-2 text-xs leading-relaxed text-primary-gray">
            A short note about your reading taste, favorite genres, or current shelf.
          </p>
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-5 py-2 text-sm"
        disabled={isSavingProfile || hasUsernameError}
      >
        {isSavingProfile ? <InlineSpinner /> : null}
        {isSavingProfile ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
