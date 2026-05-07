import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getMyProfile,
  updateBio,
  updateUser,
  uploadProfilePicture,
} from "../../profile/services/userService";
import type {
  UpdateBioPayload,
  UpdateUserPayload,
  UserProfile,
} from "../../profile/types/user";
import { profileKeys } from "../../profile/hooks/profile.keys";

interface UseSettingsProfileResult {
  user?: UserProfile | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSavingProfile: boolean;
  isUploadingPicture: boolean;
  refetch: () => void;
  updateProfile: (payload: UpdateUserPayload & UpdateBioPayload) => Promise<void>;
  uploadProfilePicture: (file: File) => void;
}

export function useSettingsProfile(token?: string | null): UseSettingsProfileResult {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getMyProfile(token),
  });
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(token, data),
  });
  const updateBioMutation = useMutation({
    mutationFn: (data: UpdateBioPayload) => updateBio(data, token),
  });
  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePicture(file, token),
    onSuccess: () => {
      toast.success("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    onError: () => {
      toast.error("Couldn't upload picture. Try again.");
    },
  });

  return {
    user: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isFetching: profileQuery.isFetching,
    isError: profileQuery.isError,
    isSavingProfile: updateMutation.isPending || updateBioMutation.isPending,
    isUploadingPicture: uploadPictureMutation.isPending,
    refetch: () => void profileQuery.refetch(),
    updateProfile: async (payload) => {
      const userPayload: UpdateUserPayload = {};
      const profilePayload: UpdateBioPayload = {};

      if (payload.username !== undefined) userPayload.username = payload.username;
      if (payload.bio !== undefined) profilePayload.bio = payload.bio;
      if (payload.interests !== undefined) profilePayload.interests = payload.interests;
      if (payload.social_links !== undefined) profilePayload.social_links = payload.social_links;
      if (payload.profile_type !== undefined) profilePayload.profile_type = payload.profile_type;

      await Promise.all([
        updateMutation.mutateAsync(userPayload),
        updateBioMutation.mutateAsync(profilePayload),
      ]);
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    uploadProfilePicture: (file) => uploadPictureMutation.mutate(file),
  };
}
