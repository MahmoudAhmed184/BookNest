import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { ErrorState } from "../../../components/ui";
import { routePaths } from "../../../routes/paths";
import { useAuth } from "../../auth/hooks/useAuth";
import { catalogKeys } from "../../catalog/hooks/catalog.keys";
import { getGenreOptions } from "../../catalog/services/bookService";
import type { CatalogGenre } from "../../catalog/types/book";
import type { ProfileInterestSelection } from "../../profile/types/user";
import {
  SettingsContent,
  SettingsProfileOverview,
  SettingsSkeleton,
  SettingsTabs,
  type SettingsTab,
} from "../components/SettingsSections";
import { settingsTabs } from "../constants/settingsTabs";
import {
  toProfileInterestSelection,
  useSettingsProfile,
} from "../hooks/useSettingsProfile";
import type {
  SettingsProfileType,
  SettingsSocialLinkDraft,
} from "../types/settings";
import { getPasswordUpdateError } from "../utils/settingsValidation";

export default function Settings(): ReactElement {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const {
    user,
    preferences,
    isLoading,
    isFetching,
    isError,
    isSavingProfile,
    isSavingPreferences,
    isUploadingPicture,
    isChangingPassword,
    refetch,
    updateProfile,
    updatePreferences,
    uploadProfilePicture,
    changePassword,
  } = useSettingsProfile(token);

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [profileType, setProfileType] = useState<SettingsProfileType>("reader");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<
    ProfileInterestSelection[]
  >([]);
  const [genreQuery, setGenreQuery] = useState("");
  const [socialLinks, setSocialLinks] = useState<SettingsSocialLinkDraft[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const trimmedGenreQuery = genreQuery.trim();

  const genreOptionsQuery = useQuery({
    queryKey: catalogKeys.genreOptions(trimmedGenreQuery, 20),
    queryFn: () => getGenreOptions(trimmedGenreQuery, 20),
    enabled: trimmedGenreQuery.length > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!user) return;

    setDisplayName(user.user.display_name || "");
    setHandle(user.handle || "");
    setBio(user.bio || "");
    setProfileType(user.profile_type || "reader");
    setLocation(user.location || "");
    setWebsiteUrl(user.website_url || "");
    setSelectedInterests(
      (user.interest_links ?? []).map(toProfileInterestSelection)
    );
    setSocialLinks((user.social_links ?? []).map(toSocialLinkDraft));
  }, [user]);

  const handleUpdateAccount = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    try {
      await updateProfile({ display_name: displayName.trim() });
    } catch {
      toast.error("Couldn't update account. Try again.");
    }
  };

  const handleUpdateInfo = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!handle.trim() || trimmedGenreQuery.length > 0) return;

    try {
      await updateProfile({
        handle: handle.trim(),
        bio: bio.trim(),
        profile_type: profileType,
        location: location.trim(),
        website_url: normalizeUrl(websiteUrl),
        interests: selectedInterests,
        social_links: normalizeSocialLinks(socialLinks),
      });
    } catch {
      toast.error("Couldn't update profile. Try again.");
    }
  };

  const handleUpdatePassword = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setPasswordError("");

    const nextPasswordError = getPasswordUpdateError(
      currentPassword,
      newPassword,
      confirmPassword
    );
    if (nextPasswordError) {
      setPasswordError(nextPasswordError);
      return;
    }

    try {
      await changePassword({
        old_password: currentPassword,
        new_password1: newPassword,
        new_password2: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError(
        "Password could not be updated. Check your current password and try again."
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    uploadProfilePicture(file);
  };

  const handleLogout = (): void => {
    logout();
    navigate(routePaths.login);
  };

  const handleAddInterest = (genre: CatalogGenre): void => {
    setSelectedInterests((current) => {
      if (current.some((interest) => interest.genre === genre.id)) {
        return current;
      }

      return [
        ...current,
        {
          genre: genre.id,
          genre_name: genre.name,
          weight: 60,
        },
      ];
    });
    setGenreQuery("");
  };

  const handleRemoveInterest = (genreId: number): void => {
    setSelectedInterests((current) =>
      current.filter((interest) => interest.genre !== genreId)
    );
  };

  const handleInterestWeightChange = (
    genreId: number,
    weight: number
  ): void => {
    setSelectedInterests((current) =>
      current.map((interest) =>
        interest.genre === genreId
          ? { ...interest, weight: Math.min(Math.max(weight, 1), 100) }
          : interest
      )
    );
  };

  const handleAddSocialLink = (): void => {
    setSocialLinks((current) => [...current, createSocialLinkDraft()]);
  };

  const handleRemoveSocialLink = (key: string): void => {
    setSocialLinks((current) => current.filter((link) => link.key !== key));
  };

  const handleSocialLinkChange = (
    key: string,
    field: keyof Omit<SettingsSocialLinkDraft, "key" | "id">,
    value: string
  ): void => {
    setSocialLinks((current) =>
      current.map((link) =>
        link.key === key ? { ...link, [field]: value } : link
      )
    );
  };

  if (isLoading) return <SettingsSkeleton />;

  if (isError || !user) {
    return (
      <div className="py-12">
        <ErrorState
          title="Settings could not be loaded"
          message="We could not load your account settings right now."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 py-8 animate-fade-up lg:gap-8 lg:py-12">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-accent">BookNest controls</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-primary-white md:text-5xl">
              Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-gray md:text-base">
              Manage your BookNest account, profile, and security details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] w-fit rounded-lg border border-[var(--surface-glass-border)] px-4 text-sm font-semibold text-primary-white hover:border-accent hover:text-accent lg:hidden"
          >
            Log out
          </button>
        </div>
      </header>

      <SettingsProfileOverview
        user={user}
        preferences={preferences}
        selectedFile={selectedFile}
        isUploading={isUploadingPicture}
        onFileChange={handleFileChange}
      />

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="lg:sticky lg:top-28">
          <SettingsTabs
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />
        </aside>

        <SettingsContent
          user={user}
          preferences={preferences}
          displayName={displayName}
          handle={handle}
          bio={bio}
          profileType={profileType}
          location={location}
          websiteUrl={websiteUrl}
          interests={selectedInterests}
          genreQuery={genreQuery}
          genreOptions={genreOptionsQuery.data ?? []}
          isLoadingGenreOptions={genreOptionsQuery.isFetching}
          socialLinks={socialLinks}
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          showCurrentPassword={showCurrentPassword}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          isSavingAccount={isSavingProfile}
          isSavingProfile={isSavingProfile}
          isSavingPreferences={isSavingPreferences}
          isChangingPassword={isChangingPassword}
          onDisplayNameChange={setDisplayName}
          onHandleChange={setHandle}
          onBioChange={setBio}
          onProfileTypeChange={setProfileType}
          onLocationChange={setLocation}
          onWebsiteUrlChange={setWebsiteUrl}
          onGenreQueryChange={setGenreQuery}
          onAddInterest={handleAddInterest}
          onRemoveInterest={handleRemoveInterest}
          onInterestWeightChange={handleInterestWeightChange}
          onAddSocialLink={handleAddSocialLink}
          onRemoveSocialLink={handleRemoveSocialLink}
          onSocialLinkChange={handleSocialLinkChange}
          onCurrentPasswordChange={setCurrentPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onToggleCurrentPassword={() =>
            setShowCurrentPassword((current) => !current)
          }
          onToggleNewPassword={() => setShowNewPassword((current) => !current)}
          onToggleConfirmPassword={() =>
            setShowConfirmPassword((current) => !current)
          }
          onUpdateAccount={handleUpdateAccount}
          onUpdateInfo={handleUpdateInfo}
          onUpdatePassword={handleUpdatePassword}
          onUpdatePreferences={(payload) => void updatePreferences(payload)}
        />
      </div>
    </div>
  );
}

function socialLinkKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSocialLinkDraft(): SettingsSocialLinkDraft {
  return {
    key: socialLinkKey("new"),
    platform: "website",
    url: "",
    label: "",
  };
}

function toSocialLinkDraft(link: {
  id: number;
  platform: string;
  url: string;
  label?: string;
}): SettingsSocialLinkDraft {
  return {
    key: `existing-${link.id}`,
    id: link.id,
    platform: link.platform || "website",
    url: link.url || "",
    label: link.label ?? "",
  };
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

function normalizeSocialLinks(
  links: SettingsSocialLinkDraft[]
): SettingsSocialLinkDraft[] {
  const seenPlatforms = new Set<string>();

  return links
    .map((link) => ({
      ...link,
      platform: link.platform.trim(),
      url: normalizeUrl(link.url),
      label: link.label.trim(),
    }))
    .filter((link) => {
      if (!link.platform || !link.url) return false;

      const platformKey = link.platform.toLowerCase();
      if (seenPlatforms.has(platformKey)) return false;

      seenPlatforms.add(platformKey);
      return true;
    });
}
