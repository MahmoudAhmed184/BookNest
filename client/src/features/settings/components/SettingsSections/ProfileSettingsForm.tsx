import type { FormEvent, ReactElement } from "react";

import { FieldError, InlineSpinner } from "../../../../components/ui";
import type { CatalogGenre } from "../../../catalog/types/book";
import type { ProfileInterestSelection } from "../../../profile/types/user";
import type {
  SettingsProfileType,
  SettingsSocialLinkDraft,
} from "../../types/settings";

export interface ProfileSettingsFormProps {
  handle: string;
  bio: string;
  profileType: SettingsProfileType;
  location: string;
  websiteUrl: string;
  interests: ProfileInterestSelection[];
  genreQuery: string;
  genreOptions: CatalogGenre[];
  isLoadingGenreOptions: boolean;
  socialLinks: SettingsSocialLinkDraft[];
  isSavingProfile: boolean;
  onHandleChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onProfileTypeChange: (value: SettingsProfileType) => void;
  onLocationChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  onGenreQueryChange: (value: string) => void;
  onAddInterest: (genre: CatalogGenre) => void;
  onRemoveInterest: (genreId: number) => void;
  onInterestWeightChange: (genreId: number, weight: number) => void;
  onAddSocialLink: () => void;
  onRemoveSocialLink: (key: string) => void;
  onSocialLinkChange: (
    key: string,
    field: keyof Omit<SettingsSocialLinkDraft, "key" | "id">,
    value: string
  ) => void;
  onUpdateInfo: (event: FormEvent<HTMLFormElement>) => void;
}

const profileTypeOptions: Array<{
  value: SettingsProfileType;
  label: string;
  description: string;
}> = [
  {
    value: "reader",
    label: "Reader",
    description: "Personal shelves, ratings, and recommendations.",
  },
  {
    value: "creator",
    label: "Creator",
    description: "Reviews, essays, and public reading commentary.",
  },
  {
    value: "librarian",
    label: "Librarian",
    description: "Curation, catalog expertise, and community lists.",
  },
  {
    value: "staff",
    label: "Staff",
    description: "Operational BookNest account.",
  },
];

const socialPlatforms = [
  "website",
  "goodreads",
  "storygraph",
  "x",
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
];

export function ProfileSettingsForm({
  handle,
  bio,
  profileType,
  location,
  websiteUrl,
  interests,
  genreQuery,
  genreOptions,
  isLoadingGenreOptions,
  socialLinks,
  isSavingProfile,
  onHandleChange,
  onBioChange,
  onProfileTypeChange,
  onLocationChange,
  onWebsiteUrlChange,
  onGenreQueryChange,
  onAddInterest,
  onRemoveInterest,
  onInterestWeightChange,
  onAddSocialLink,
  onRemoveSocialLink,
  onSocialLinkChange,
  onUpdateInfo,
}: ProfileSettingsFormProps): ReactElement {
  const hasHandleError = !handle.trim();
  const hasPendingGenreQuery = genreQuery.trim().length > 0;
  const selectableGenres = genreOptions.filter(
    (genre) => !interests.some((interest) => interest.genre === genre.id)
  );

  return (
    <section
      id="settings-profile"
      className="settings-panel scroll-mt-28 p-5 sm:p-6"
      aria-labelledby="profile-settings-title"
    >
      <form onSubmit={onUpdateInfo} className="grid gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">Profile</p>
            <h2 id="profile-settings-title" className="mt-1 text-2xl font-bold text-primary-white">
              Public reader profile
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-gray">
              Shape how readers discover your taste, shelves, and links.
            </p>
          </div>
          <button
            type="submit"
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 self-start px-5 py-2 text-sm sm:self-center"
            disabled={isSavingProfile || hasHandleError || hasPendingGenreQuery}
          >
            {isSavingProfile ? <InlineSpinner /> : null}
            {isSavingProfile ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="settings-handle"
              className="mb-2 block text-sm font-semibold text-primary-gray"
            >
              Handle <span aria-hidden="true" className="text-accent">*</span>
            </label>
            <input
              type="text"
              id="settings-handle"
              value={handle}
              onChange={(event) => onHandleChange(event.target.value)}
              className={`field w-full text-primary-white ${hasHandleError ? "border-accent" : ""}`}
              autoComplete="username"
              maxLength={64}
              aria-invalid={hasHandleError}
              aria-describedby={hasHandleError ? "settings-handle-error" : undefined}
            />
            <div id="settings-handle-error">
              <FieldError message={hasHandleError ? "Handle is required" : undefined} />
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-location"
              className="mb-2 block text-sm font-semibold text-primary-gray"
            >
              Location
            </label>
            <input
              id="settings-location"
              type="text"
              value={location}
              onChange={(event) => onLocationChange(event.target.value)}
              className="field w-full text-primary-white"
              autoComplete="address-level2"
              maxLength={120}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="settings-website"
              className="mb-2 block text-sm font-semibold text-primary-gray"
            >
              Website
            </label>
            <input
              id="settings-website"
              type="text"
              inputMode="url"
              value={websiteUrl}
              onChange={(event) => onWebsiteUrlChange(event.target.value)}
              className="field w-full text-primary-white"
              autoComplete="url"
              placeholder="https://example.com"
              maxLength={500}
            />
          </div>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-primary-gray">Profile type</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {profileTypeOptions.map((option) => {
              const isSelected = profileType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`min-h-[76px] rounded-lg border p-4 text-left ${
                    isSelected
                      ? "border-accent bg-accent/15 text-primary-white"
                      : "border-[var(--surface-glass-border)] text-primary-gray hover:border-accent hover:text-primary-white"
                  }`}
                  onClick={() => onProfileTypeChange(option.value)}
                  aria-pressed={isSelected}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-primary-gray">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="settings-bio"
            className="mb-2 block text-sm font-semibold text-primary-gray"
          >
            Bio
          </label>
          <textarea
            id="settings-bio"
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            className="field min-h-36 w-full resize-y text-primary-white"
            rows={5}
            maxLength={1200}
            aria-describedby="settings-bio-help"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-primary-gray">
            <p id="settings-bio-help">
              Add current reads, favorite genres, or what you want readers to know.
            </p>
            <span>{bio.length}/1200</span>
          </div>
        </div>

        <section className="grid gap-3" aria-labelledby="settings-interests-title">
          <div>
            <h3 id="settings-interests-title" className="text-base font-bold text-primary-white">
              Reading interests
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-primary-gray">
              Interests help tune the recommendations and genres you see first.
            </p>
          </div>

          <div className="relative">
            <label htmlFor="settings-interests" className="sr-only">
              Search genres
            </label>
            <input
              id="settings-interests"
              value={genreQuery}
              onChange={(event) => onGenreQueryChange(event.target.value)}
              className="field w-full text-primary-white"
              role="combobox"
              aria-expanded={hasPendingGenreQuery}
              aria-controls="settings-genre-options"
              autoComplete="off"
              placeholder="Search genres to add"
            />
            {hasPendingGenreQuery ? (
              <div
                id="settings-genre-options"
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
                        className="min-h-11 rounded-lg px-3 text-left text-sm font-semibold text-primary-white hover:bg-secondary-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            <div className="grid gap-2">
              {interests.map((interest) => (
                <div
                  key={interest.genre}
                  className="grid gap-3 rounded-lg border border-[var(--surface-glass-border)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(150px,220px)_auto] md:items-center"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-primary-white">
                    {interest.genre_name}
                  </span>
                  <label className="grid gap-1 text-xs font-semibold text-primary-gray">
                    Weight: {interest.weight}
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={interest.weight}
                      onChange={(event) =>
                        onInterestWeightChange(
                          interest.genre,
                          Number(event.target.value)
                        )
                      }
                      className="accent-accent"
                    />
                  </label>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-secondary-gray px-3 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent"
                    onClick={() => onRemoveInterest(interest.genre)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--surface-glass-border)] p-4 text-sm text-primary-gray">
              No interests added yet.
            </p>
          )}
          <FieldError
            message={
              hasPendingGenreQuery
                ? "Select a matching genre before saving."
                : undefined
            }
          />
        </section>

        <section className="grid gap-3" aria-labelledby="settings-social-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 id="settings-social-title" className="text-base font-bold text-primary-white">
                Social links
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-primary-gray">
                Add one link per platform so readers can find your work elsewhere.
              </p>
            </div>
            <button
              type="button"
              className="min-h-[44px] rounded-lg border border-[var(--surface-glass-border)] px-4 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent"
              onClick={onAddSocialLink}
            >
              Add link
            </button>
          </div>

          {socialLinks.length > 0 ? (
            <div className="grid gap-3">
              {socialLinks.map((link) => (
                <div
                  key={link.key}
                  className="grid gap-3 rounded-lg border border-[var(--surface-glass-border)] p-3 lg:grid-cols-[150px_minmax(0,1fr)_160px_auto] lg:items-end"
                >
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-primary-gray">
                      Platform
                    </label>
                    <select
                      value={link.platform}
                      className="field w-full text-primary-white"
                      onChange={(event) =>
                        onSocialLinkChange(link.key, "platform", event.target.value)
                      }
                    >
                      {socialPlatforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-primary-gray">
                      URL
                    </label>
                    <input
                      type="text"
                      inputMode="url"
                      value={link.url}
                      className="field w-full text-primary-white"
                      placeholder="https://example.com/profile"
                      maxLength={500}
                      required
                      onChange={(event) =>
                        onSocialLinkChange(link.key, "url", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-primary-gray">
                      Label
                    </label>
                    <input
                      type="text"
                      value={link.label}
                      className="field w-full text-primary-white"
                      maxLength={80}
                      onChange={(event) =>
                        onSocialLinkChange(link.key, "label", event.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="min-h-[44px] rounded-lg border border-secondary-gray px-3 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent"
                    onClick={() => onRemoveSocialLink(link.key)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--surface-glass-border)] p-4 text-sm text-primary-gray">
              No social links added yet.
            </p>
          )}
        </section>
      </form>
    </section>
  );
}
