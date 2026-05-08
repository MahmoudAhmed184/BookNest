import type { FormEvent, ReactElement } from "react";

import { FieldError, InlineSpinner } from "../../../../components/ui";
import type { CatalogGenre } from "../../../catalog/types/book";
import type { ProfileInterestSelection } from "../../../profile/types/user";

export interface ProfileSettingsFormProps {
  username: string;
  bio: string;
  profileType: string;
  interests: ProfileInterestSelection[];
  genreQuery: string;
  genreOptions: CatalogGenre[];
  isLoadingGenreOptions: boolean;
  socialLinksText: string;
  isSavingProfile: boolean;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onProfileTypeChange: (value: string) => void;
  onGenreQueryChange: (value: string) => void;
  onAddInterest: (genre: CatalogGenre) => void;
  onRemoveInterest: (genreId: number) => void;
  onInterestWeightChange: (genreId: number, weight: number) => void;
  onSocialLinksTextChange: (value: string) => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
}

export function ProfileSettingsForm({
  username,
  bio,
  profileType,
  interests,
  genreQuery,
  genreOptions,
  isLoadingGenreOptions,
  socialLinksText,
  isSavingProfile,
  onUsernameChange,
  onBioChange,
  onProfileTypeChange,
  onGenreQueryChange,
  onAddInterest,
  onRemoveInterest,
  onInterestWeightChange,
  onSocialLinksTextChange,
  onUpdateInfo,
}: ProfileSettingsFormProps): ReactElement {
  const hasUsernameError = !username.trim();
  const hasPendingGenreQuery = genreQuery.trim().length > 0;
  const selectableGenres = genreOptions.filter(
    (genre) => !interests.some((interest) => interest.genre === genre.id)
  );

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
            Handle <span aria-hidden="true" className="text-accent">*</span>
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
            <FieldError message={hasUsernameError ? "Handle is required" : undefined} />
          </div>
        </div>
        <div>
          <label htmlFor="profileType" className="mb-2 block text-sm font-medium text-primary-gray">
            Profile type
          </label>
          <select
            id="profileType"
            value={profileType}
            onChange={(event) => onProfileTypeChange(event.target.value)}
            className="field w-full text-primary-white"
          >
            <option value="reader">reader</option>
            <option value="creator">creator</option>
            <option value="librarian">librarian</option>
            <option value="staff">staff</option>
          </select>
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
        <div>
          <label htmlFor="interests" className="mb-2 block text-sm font-medium text-primary-gray">
            Interests
          </label>
          <div className="relative">
            <input
              id="interests"
              value={genreQuery}
              onChange={(event) => onGenreQueryChange(event.target.value)}
              className="field w-full text-primary-white"
              role="combobox"
              aria-expanded={hasPendingGenreQuery}
              aria-controls="genre-options"
              autoComplete="off"
            />
            {hasPendingGenreQuery ? (
              <div
                id="genre-options"
                className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[var(--surface-glass-border)] bg-primary-black p-2 shadow-xl"
              >
                {isLoadingGenreOptions ? (
                  <div className="flex min-h-12 items-center px-3">
                    <InlineSpinner />
                  </div>
                ) : null}
                {!isLoadingGenreOptions && selectableGenres.length > 0 ? (
                  <div className="grid gap-1">
                    {selectableGenres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        className="min-h-11 rounded-md px-3 text-left text-sm font-semibold text-primary-white transition hover:bg-secondary-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        onClick={() => onAddInterest(genre)}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                ) : null}
                {!isLoadingGenreOptions && selectableGenres.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-primary-gray">
                    No matching genre
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {interests.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {interests.map((interest) => (
                <div
                  key={interest.genre}
                  className="grid gap-2 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/50 p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:items-center"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-primary-white">
                    {interest.genre_name}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={interest.weight}
                    onChange={(event) =>
                      onInterestWeightChange(
                        interest.genre,
                        Number(event.target.value)
                      )
                    }
                    className="field min-h-10 w-full text-primary-white"
                    aria-label={`${interest.genre_name} weight`}
                  />
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-secondary-gray px-3 text-sm font-semibold text-primary-white transition hover:border-accent hover:text-accent"
                    onClick={() => onRemoveInterest(interest.genre)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <FieldError
            message={
              hasPendingGenreQuery
                ? "Select a matching genre before saving."
                : undefined
            }
          />
        </div>
        <div>
          <label htmlFor="socialLinks" className="mb-2 block text-sm font-medium text-primary-gray">
            Social links
          </label>
          <textarea
            id="socialLinks"
            value={socialLinksText}
            onChange={(event) => onSocialLinksTextChange(event.target.value)}
            className="field min-h-24 w-full resize-y text-primary-white"
            rows={3}
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-5 py-2 text-sm"
        disabled={isSavingProfile || hasUsernameError || hasPendingGenreQuery}
      >
        {isSavingProfile ? <InlineSpinner /> : null}
        {isSavingProfile ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
