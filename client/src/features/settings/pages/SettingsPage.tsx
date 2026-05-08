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
import { useAuth } from "../../auth/hooks/useAuth";
import { catalogKeys } from "../../catalog/hooks/catalog.keys";
import { getGenreOptions } from "../../catalog/services/bookService";
import type { CatalogGenre } from "../../catalog/types/book";
import type { ProfileInterestSelection } from "../../profile/types/user";
import { routePaths } from "../../../routes/paths";
import {
  SettingsProfileOverview,
  SettingsSidebar,
  SettingsSkeleton,
  SettingsTabs,
  type SettingsTab,
} from "../components/SettingsSections";
import { settingsTabs } from "../constants/settingsTabs";
import {
  toProfileInterestSelection,
  useSettingsProfile,
} from "../hooks/useSettingsProfile";
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
    refetch,
    updateProfile,
    updatePreferences,
    uploadProfilePicture,
  } = useSettingsProfile(token);

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileType, setProfileType] = useState("reader");
  const [selectedInterests, setSelectedInterests] = useState<
    ProfileInterestSelection[]
  >([]);
  const [genreQuery, setGenreQuery] = useState("");
  const [socialLinksText, setSocialLinksText] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const trimmedGenreQuery = genreQuery.trim();
  const genreOptionsQuery = useQuery({
    queryKey: catalogKeys.genreOptions(trimmedGenreQuery, 20),
    queryFn: () => getGenreOptions(trimmedGenreQuery, 20),
    enabled: activeTab === "profile" && trimmedGenreQuery.length > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (user) {
      setUsername(user.handle || "");
      setBio(user.bio || "");
      setProfileType(user.profile_type || "reader");
      setSelectedInterests(
        (user.interest_links ?? []).map(toProfileInterestSelection)
      );
      setSocialLinksText(
        (user.social_links ?? [])
          .map((item) => `${item.platform},${item.url}${item.label ? `,${item.label}` : ""}`)
          .join("\n")
      );
    }
  }, [user]);

  const handleUpdateInfo = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!username.trim()) return;

    try {
      await updateProfile({
        handle: username,
        bio,
        profile_type: profileType as "reader" | "creator" | "librarian" | "staff",
        interests: selectedInterests,
        social_links: parseSocialLinks(socialLinksText),
      });
    } catch {
      toast.error("Couldn't update profile. Try again.");
    }
  };

  const handleUpdatePassword = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPasswordError("");

    const nextPasswordError = getPasswordUpdateError(newPassword, confirmPassword);
    if (nextPasswordError) {
      setPasswordError(nextPasswordError);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadProfilePicture(file);
    }
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
          weight: 1,
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
    <div className="flex flex-col gap-6 py-8 animate-fade-up lg:gap-8 lg:py-12">
      <header className="flex max-w-[1120px] flex-col gap-3">
        <h1 className="text-4xl font-extrabold leading-tight text-primary-white md:text-5xl">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray md:text-base">
          Manage your BookNest account, profile, and security details.
        </p>
      </header>
      <div className="grid max-w-[1120px] gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[260px_minmax(0,860px)]">
        <aside className="lg:sticky lg:top-28">
          <SettingsTabs
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <div className="hidden lg:order-1 lg:block">
            <SettingsProfileOverview
              user={user}
              selectedFile={selectedFile}
              isUploading={isUploadingPicture}
              onFileChange={handleFileChange}
              onEditProfile={() => setActiveTab("profile")}
            />
          </div>
          <div className="order-1 lg:order-2">
            <SettingsSidebar
              user={user}
              preferences={preferences}
              activeTab={activeTab}
              username={username}
              bio={bio}
              profileType={profileType}
              interests={selectedInterests}
              genreQuery={genreQuery}
              genreOptions={genreOptionsQuery.data ?? []}
              isLoadingGenreOptions={genreOptionsQuery.isFetching}
              socialLinksText={socialLinksText}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              passwordError={passwordError}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              isSavingProfile={isSavingProfile}
              isSavingPreferences={isSavingPreferences}
              onUsernameChange={setUsername}
              onBioChange={setBio}
              onProfileTypeChange={setProfileType}
              onGenreQueryChange={setGenreQuery}
              onAddInterest={handleAddInterest}
              onRemoveInterest={handleRemoveInterest}
              onInterestWeightChange={handleInterestWeightChange}
              onSocialLinksTextChange={setSocialLinksText}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onToggleNewPassword={() => setShowNewPassword((current) => !current)}
              onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
              onUpdateInfo={handleUpdateInfo}
              onUpdatePassword={handleUpdatePassword}
              onUpdatePreferences={(payload) => void updatePreferences(payload)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSocialLinks(value: string): { platform: string; url: string; label?: string }[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [platform = "", url = "", ...labelParts] = line.split(",");
      const label = labelParts.join(",").trim();
      return {
        platform: platform.trim(),
        url: url.trim(),
        ...(label ? { label } : {}),
      };
    })
    .filter((item) => item.platform && item.url);
}
