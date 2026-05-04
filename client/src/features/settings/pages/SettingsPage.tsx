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
import { routePaths } from "../../../routes/paths";
import {
  SettingsProfileOverview,
  SettingsSidebar,
  SettingsSkeleton,
  type SettingsTab,
} from "../components/SettingsSections";
import { useSettingsProfile } from "../hooks/useSettingsProfile";

const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Account Settings" },
  { id: "profile", label: "Profile Settings" },
  { id: "security", label: "Security Settings" },
];

function getPasswordUpdateError(
  newPassword: string,
  confirmPassword: string
): string {
  if (newPassword.length < 8) return "Password must be at least 8 characters";
  if (newPassword !== confirmPassword) return "Passwords do not match";
  return "";
}

export default function Settings(): ReactElement {
  const navigate = useNavigate();
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
  } = useSettingsProfile();

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
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-primary-white text-balance">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          Manage your BookNest account, profile, and security details.
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <SettingsProfileOverview
          user={user}
          selectedFile={selectedFile}
          isUploading={isUploadingPicture}
          onFileChange={handleFileChange}
          onEditProfile={() => setActiveTab("profile")}
        />
        <SettingsSidebar
          user={user}
          activeTab={activeTab}
          tabs={settingsTabs}
          username={username}
          bio={bio}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          isSavingProfile={isSavingProfile}
          onTabChange={setActiveTab}
          onLogout={() => {
            localStorage.removeItem("token");
            navigate(routePaths.login);
          }}
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
  );
}
