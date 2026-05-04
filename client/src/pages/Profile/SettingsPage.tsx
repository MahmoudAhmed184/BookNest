import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getMyProfile, updateUser, updateBio } from "../../services/userService";
import { API_BASE_URL } from "../../config";
import type { UpdateBioPayload, UpdateUserPayload } from "../../types/user";
import ErrorState from "../../components/ErrorState";
import FieldError from "../../components/FieldError";
import InlineSpinner from "../../components/InlineSpinner";

type SettingsTab = "account" | "profile" | "security";

function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

function getInitials(value?: string | null): string {
  if (!value) return "BN";
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BN"
  );
}

function PasswordIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SettingsSkeleton() {
  return (
    <div className="py-12 flex flex-col gap-8 animate-fade-up" role="status" aria-live="polite">
      <div className="h-10 w-48 rounded-full animate-shimmer" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="h-64 w-64 rounded-xl animate-shimmer" />
          <div className="h-28 rounded-xl animate-shimmer" />
        </div>
        <div className="h-80 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getMyProfile,
  });

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

  const token = localStorage.getItem("token");

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(token, data),
  });

  const updateBioMutation = useMutation({
    mutationFn: (data: UpdateBioPayload) => updateBio(data),
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File): Promise<unknown> => {
      const formData = new FormData();
      formData.append("profile_pic", file);

      const res = await fetch(`${API_BASE_URL}/api/users/profile/upload_picture/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => {
      toast.error("Couldn't upload picture. Try again.");
    },
  });

  const handleUpdateInfo = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!username.trim()) return;

    try {
      await Promise.all([
        updateMutation.mutateAsync({ username, bio }),
        updateBioMutation.mutateAsync({ bio }),
      ]);
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch {
      toast.error("Couldn't update profile. Try again.");
    }
  };

  const handleUpdatePassword = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  };

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadPictureMutation.mutate(file);
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

  const profileImage = resolveProfileImage(user.profile_pic);
  const isSavingProfile = updateMutation.isPending || updateBioMutation.isPending;

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: "account", label: "Account Settings" },
    { id: "profile", label: "Profile Settings" },
    { id: "security", label: "Security Settings" },
  ];

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
        <section className="flex flex-col gap-8" aria-labelledby="settings-profile-title">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
            <label
              htmlFor="profile-picture"
              className="group relative block w-64 aspect-square cursor-pointer overflow-hidden rounded-xl bg-secondary-black shadow-xl focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${user.username}'s profile`}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                  width="256"
                  height="256"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-primary-white">
                  {getInitials(user.username)}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-primary-black/70 text-sm font-medium text-primary-white opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
                {uploadPictureMutation.isPending ? "Uploading..." : "Change Picture"}
              </span>
              <input
                id="profile-picture"
                type="file"
                accept="image/jpg, image/jpeg, image/png, image/gif, image/webp"
                onChange={handleFileChange}
                className="sr-only"
                disabled={uploadPictureMutation.isPending}
              />
            </label>

            <div className="flex flex-col gap-3 text-center md:text-left">
              <h2 id="settings-profile-title" className="text-2xl font-semibold text-primary-white">
                {user.username}
              </h2>
              <p className="text-sm text-primary-gray">@{user.username}</p>
              <p className="text-sm text-primary-gray">
                Member since {user.created_at || "Unknown"}
              </p>
              {selectedFile ? (
                <p className="text-xs text-primary-gray">
                  Selected: {selectedFile.name}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm"
                onClick={() => setActiveTab("profile")}
              >
                Edit Profile
              </button>
            </div>
          </div>

          <section className="flex flex-col gap-3" aria-labelledby="settings-bio-title">
            <h2 id="settings-bio-title" className="text-xl font-semibold text-primary-white">
              Bio
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-primary-white">
              {user.bio || "No bio added yet."}
            </p>
          </section>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-xl bg-secondary-black p-4 shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium transition-all duration-200 ease-out ${
                  activeTab === tab.id
                    ? "btn-accent-v text-primary-white shadow-md"
                    : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
                }`}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium text-primary-gray hover:bg-primary-black hover:text-primary-white"
            >
              Logout
            </button>
          </div>

          <div className="rounded-xl bg-secondary-black p-6 shadow-md">
            {activeTab === "account" ? (
              <section className="flex flex-col gap-4" aria-labelledby="account-settings-title">
                <h2 id="account-settings-title" className="text-lg font-semibold text-primary-white">
                  Account Settings
                </h2>
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="rounded-xl bg-primary-black p-4">
                    <dt className="text-primary-gray">Username</dt>
                    <dd className="mt-1 font-medium text-primary-white">
                      {user.username}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-primary-black p-4">
                    <dt className="text-primary-gray">Email</dt>
                    <dd className="mt-1 font-medium text-primary-white">
                      {user.email || "Not provided"}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : null}

            {activeTab === "profile" ? (
              <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-primary-white">
                  Profile Settings
                </h2>
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm text-primary-gray">
                    Username <span aria-hidden="true" className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className={`w-full min-h-[44px] rounded-lg bg-secondary-gray px-3 py-2 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black ${
                      !username.trim() ? "border border-red-500" : ""
                    }`}
                    autoComplete="username"
                    aria-invalid={!username.trim()}
                    aria-describedby="settings-username-error"
                  />
                  <div id="settings-username-error">
                    <FieldError
                      message={!username.trim() ? "Username is required" : undefined}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bio" className="mb-2 block text-sm text-primary-gray">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    className="w-full rounded-lg bg-secondary-gray px-3 py-2 text-primary-white outline-hidden resize-y focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
                    rows={5}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm"
                  disabled={isSavingProfile || !username.trim()}
                >
                  {isSavingProfile ? <InlineSpinner /> : null}
                  {isSavingProfile ? "Updating..." : "Update Info"}
                </button>
              </form>
            ) : null}

            {activeTab === "security" ? (
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-primary-white">
                  Security Settings
                </h2>
                <div>
                  <label htmlFor="settings-new-password" className="mb-2 block text-sm text-primary-gray">
                    New password <span aria-hidden="true" className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="settings-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-secondary-gray px-3 py-2 pr-12 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                      aria-label={
                        showNewPassword ? "Hide new password" : "Show new password"
                      }
                    >
                      <PasswordIcon />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-confirm-password" className="mb-2 block text-sm text-primary-gray">
                    Confirm password <span aria-hidden="true" className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="settings-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-secondary-gray px-3 py-2 pr-12 text-primary-white outline-hidden focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary-black"
                      autoComplete="new-password"
                      aria-describedby="settings-password-error"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-xl text-primary-gray hover:text-primary-white"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      <PasswordIcon />
                    </button>
                  </div>
                  <div id="settings-password-error">
                    <FieldError message={passwordError || undefined} />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm"
                >
                  Update Password
                </button>
              </form>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
