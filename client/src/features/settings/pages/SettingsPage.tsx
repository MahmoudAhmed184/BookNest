import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { ErrorState } from "../../../components/ui";
import { useOptionalAuth } from "../../auth/hooks/useOptionalAuth";
import { routePaths } from "../../../routes/paths";
import {
  SettingsProfileOverview,
  SettingsSidebar,
  SettingsSkeleton,
  SettingsTabs,
  type SettingsTab,
} from "../components/SettingsSections";
import { settingsTabs } from "../constants/settingsTabs";
import { useSettingsProfile } from "../hooks/useSettingsProfile";
import { getPasswordUpdateError } from "../utils/settingsValidation";

export default function Settings(): ReactElement {
  const navigate = useNavigate();
  const { token, logout } = useOptionalAuth();
  const {
    user,
    isLoading,
    isFetching,
    isError,
    isSavingProfile,
    isUploadingPicture,
    refetch,
    updateProfile,
    uploadProfilePicture,
  } = useSettingsProfile(token);

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleUpdateInfo = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!username.trim()) return;

    try {
      await updateProfile({ username, bio });
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
              activeTab={activeTab}
              username={username}
              bio={bio}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              passwordError={passwordError}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              isSavingProfile={isSavingProfile}
              onUsernameChange={setUsername}
              onBioChange={setBio}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onToggleNewPassword={() => setShowNewPassword((current) => !current)}
              onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
              onUpdateInfo={handleUpdateInfo}
              onUpdatePassword={handleUpdatePassword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
