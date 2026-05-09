import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { changePassword as changePasswordRequest } from "../../auth/services/authService";
import type { ChangePasswordPayload } from "../../auth/types/auth";
import {
  createProfileInterest,
  createUserSocialLink,
  deleteProfileInterest,
  deleteUserSocialLink,
  getMyProfile,
  getPreferences,
  updateBio,
  updatePreferences,
  updateProfileInterest,
  updateUser,
  updateUserSocialLink,
  uploadProfilePicture,
} from "../../profile/services/userService";
import type {
  Profile,
  ProfileInterest,
  ProfileInterestSelection,
  UpdateProfilePayload,
  UpdateUserPayload,
  UserPreference,
  UserSocialLink,
} from "../../profile/types/user";
import { profileKeys } from "../../profile/hooks/profile.keys";
import { catalogKeys } from "../../catalog/hooks/catalog.keys";
import type { SettingsSocialLinkDraft } from "../types/settings";

interface SettingsProfilePayload extends UpdateUserPayload, UpdateProfilePayload {
  interests?: ProfileInterestSelection[];
  social_links?: SettingsSocialLinkDraft[];
}

interface UseSettingsProfileResult {
  user?: Profile | undefined;
  preferences?: UserPreference | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSavingProfile: boolean;
  isSavingPreferences: boolean;
  isUploadingPicture: boolean;
  isChangingPassword: boolean;
  refetch: () => void;
  updateProfile: (payload: SettingsProfilePayload) => Promise<void>;
  updatePreferences: (payload: Partial<UserPreference>) => Promise<void>;
  uploadProfilePicture: (file: File) => void;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function profileInterestSelection(interest: ProfileInterest): ProfileInterestSelection {
  return {
    id: interest.id,
    genre: interest.genre,
    genre_name: interest.genre_name ?? String(interest.genre),
    weight: interest.weight,
  };
}

async function syncInterests(
  currentInterests: ProfileInterest[],
  nextInterests: ProfileInterestSelection[],
  token?: string | null
): Promise<void> {
  const nextByGenre = new Map(
    nextInterests.map((interest) => [interest.genre, interest])
  );
  const currentByGenre = new Map(
    currentInterests.map((interest) => [interest.genre, interest])
  );

  await Promise.all([
    ...Array.from(nextByGenre.values()).map((interest) => {
      const existing = currentByGenre.get(interest.genre);
      if (existing) {
        return updateProfileInterest(
          existing.id,
          { genre: interest.genre, weight: interest.weight },
          token
        );
      }

      return createProfileInterest(
        { genre: interest.genre, weight: interest.weight },
        token
      );
    }),
    ...currentInterests
      .filter((interest) => !nextByGenre.has(interest.genre))
      .map((interest) => deleteProfileInterest(interest.id, token)),
  ]);
}

async function syncSocialLinks(
  currentLinks: UserSocialLink[],
  nextLinks: SettingsSocialLinkDraft[],
  token?: string | null
): Promise<void> {
  const nextByPlatform = new Map(
    nextLinks.map((link) => [normalizeKey(link.platform), link])
  );
  const currentByPlatform = new Map(
    currentLinks.map((link) => [normalizeKey(link.platform), link])
  );

  await Promise.all([
    ...nextLinks.map((link) => {
      const existing = currentByPlatform.get(normalizeKey(link.platform));
      const payload = {
        platform: link.platform,
        url: link.url,
        label: link.label ?? "",
      };

      if (existing) {
        return updateUserSocialLink(existing.id, payload, token);
      }

      return createUserSocialLink(payload, token);
    }),
    ...currentLinks
      .filter((link) => !nextByPlatform.has(normalizeKey(link.platform)))
      .map((link) => deleteUserSocialLink(link.id, token)),
  ]);
}

export function useSettingsProfile(token?: string | null): UseSettingsProfileResult {
  const queryClient = useQueryClient();
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getMyProfile(token),
    enabled: Boolean(token),
  });
  const preferencesQuery = useQuery({
    queryKey: profileKeys.preferences(),
    queryFn: () => getPreferences(token),
    enabled: Boolean(token),
  });
  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(token, data),
  });
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateBio(data, token),
  });
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserPreference>) =>
      updatePreferences(data, token),
    onSuccess: () => {
      toast.success("Preferences updated.");
      queryClient.invalidateQueries({ queryKey: profileKeys.preferences() });
    },
    onError: () => {
      toast.error("Couldn't update preferences. Try again.");
    },
  });
  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePicture(file, token),
    onSuccess: () => {
      toast.success("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
    onError: () => {
      toast.error("Couldn't upload picture. Try again.");
    },
  });
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      changePasswordRequest(data, token),
    onSuccess: () => {
      toast.success("Password updated.");
    },
    onError: () => {
      toast.error("Couldn't update password. Check your current password and try again.");
    },
  });

  return {
    user: profileQuery.data,
    preferences: preferencesQuery.data,
    isLoading: profileQuery.isLoading || preferencesQuery.isLoading,
    isFetching: profileQuery.isFetching || preferencesQuery.isFetching,
    isError: profileQuery.isError || preferencesQuery.isError,
    isSavingProfile:
      updateUserMutation.isPending || updateProfileMutation.isPending || isSyncingProfile,
    isSavingPreferences: updatePreferencesMutation.isPending,
    isUploadingPicture: uploadPictureMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    refetch: () => {
      void profileQuery.refetch();
      void preferencesQuery.refetch();
    },
    updateProfile: async (payload) => {
      setIsSyncingProfile(true);
      const userPayload: UpdateUserPayload = {};
      const profilePayload: UpdateProfilePayload = {};

      if (payload.display_name !== undefined) {
        userPayload.display_name = payload.display_name;
      }
      if (payload.handle !== undefined) profilePayload.handle = payload.handle;
      if (payload.bio !== undefined) profilePayload.bio = payload.bio;
      if (payload.profile_type !== undefined) {
        profilePayload.profile_type = payload.profile_type;
      }
      if (payload.location !== undefined) profilePayload.location = payload.location;
      if (payload.website_url !== undefined) {
        profilePayload.website_url = payload.website_url;
      }

      try {
        await Promise.all([
          Object.keys(userPayload).length > 0
            ? updateUserMutation.mutateAsync(userPayload)
            : Promise.resolve(),
          Object.keys(profilePayload).length > 0
            ? updateProfileMutation.mutateAsync(profilePayload)
            : Promise.resolve(),
          payload.interests
            ? syncInterests(profileQuery.data?.interest_links ?? [], payload.interests, token)
            : Promise.resolve(),
          payload.social_links
            ? syncSocialLinks(profileQuery.data?.social_links ?? [], payload.social_links, token)
            : Promise.resolve(),
        ]);

        toast.success("Profile updated.");
        queryClient.invalidateQueries({ queryKey: profileKeys.me() });
        queryClient.invalidateQueries({ queryKey: profileKeys.all });
        queryClient.invalidateQueries({ queryKey: catalogKeys.genres(200) });
      } finally {
        setIsSyncingProfile(false);
      }
    },
    updatePreferences: async (payload) => {
      await updatePreferencesMutation.mutateAsync(payload);
    },
    uploadProfilePicture: (file) => uploadPictureMutation.mutate(file),
    changePassword: async (payload) => {
      await changePasswordMutation.mutateAsync(payload);
    },
  };
}

export function toProfileInterestSelection(
  interest: ProfileInterest
): ProfileInterestSelection {
  return profileInterestSelection(interest);
}
