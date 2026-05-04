import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateUser, updateBio } from "../services/userService";
import toast from "react-hot-toast";

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getMyProfile,
  });

  const [activeTab, setActiveTab] = useState("account");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const token = localStorage.getItem("token");

  const updateMutation = useMutation({
    mutationFn: (data) => updateUser(token, data),
    onSuccess: () => {
      toast.success("Profile updated successfully", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error("Failed to update profile", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const updateBioMutation = useMutation({
    mutationFn: (data) => updateBio(data),
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("profile_pic", file);

      const res = await fetch(
        `http://localhost:8000/api/users/profile/upload_picture/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile picture updated successfully", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      queryClient.invalidateQueries(["user"]);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to upload picture", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    updateMutation.mutate({ username, bio });
    updateBioMutation.mutate({ bio });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      console.log("Password updated successfully:", newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setActiveTab("security");
    } else {
      alert("Passwords do not match");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      uploadPictureMutation.mutate(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-md py-md">
      {/* Profile Overview */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex flex-col items-center md:flex-row gap-4 md:items-end">
          <div className="w-64 aspect-square overflow-hidden rounded-lg bg-secondary-black">
            <label className="relative w-64 aspect-square rounded-2xl overflow-hidden cursor-pointer group">
              {user?.profile_pic ? (
                <img
                  src={
                    user.profile_pic.endsWith("image")
                      ? `${user.profile_pic}.svg`
                      : user.profile_pic
                  }
                  alt={`${user?.username}'s profile`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-secondary-black flex items-center justify-center text-primary-white text-sm">
                  No Image
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-primary-white text-xs font-medium">
                  Change Picture
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/jpg, image/jpeg, image/png, image/gif, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-primary-white">
              {user?.username}
            </h2>
            <button
              type="button"
              className="btn btn-accent-v px-4 py-2 text-sm font-medium rounded-md text-primary-white hover:btn-accent-v/80"
              onClick={() => setActiveTab("profile")}
            >
              Edit Profile
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-primary-gray">
            <span className="text-primary-white">@{user?.username}</span> •
            Member since {user?.created_at}
          </p>
        </div>
        <h2 className="text-md sm:text-xl font-semibold text-primary-white">
          Bio
        </h2>
        <p className="text-base leading-relaxed text-primary-white">
          {user?.bio}
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="flex flex-col rounded-2xl bg-secondary-black shadow-md p-4 gap-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "account"
                ? "btn-accent-v text-primary-white"
                : "text-primary-gray hover:btn-accent-v/20 hover:text-primary-white"
            }`}
          >
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "btn-accent-v text-primary-white"
                : "text-primary-gray hover:btn-accent-v/20 hover:text-primary-white"
            }`}
          >
            Profile Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-primary-gray hover:btn-accent-v/20 hover:text-primary-white"
          >
            Logout
          </button>
        </div>

        <div className="rounded-2xl bg-secondary-black shadow-md p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-primary-white">
                Profile Settings
              </h3>
              <div className="flex flex-col gap-2">
                <label htmlFor="username" className="text-sm text-primary-gray">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary-gray text-primary-white focus:outline-none focus:ring-2 focus:ring-accent-v"
                  placeholder="Username"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="bio" className="text-sm text-primary-gray">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary-gray text-primary-white focus:outline-none focus:ring-2 focus:ring-accent-v resize-y"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button
                type="submit"
                className="btn btn-accent-v px-4 py-2 text-sm font-medium rounded-md text-primary-white hover:btn-accent-v/80"
              >
                Update Info
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
