import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getMyProfile,
  updateBio,
  updateUser,
  uploadProfilePicture,
} from "../../../services/userService";
import type {
  UpdateBioPayload,
  UpdateUserPayload,
  UserProfile,
} from "../../../types/user";
import { profileKeys } from "./profile.keys";

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

export function useSettingsProfile(): UseSettingsProfileResult {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");
  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyProfile,
  });
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(token, data),
  });
  const updateBioMutation = useMutation({
    mutationFn: (data: UpdateBioPayload) => updateBio(data),
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
      await Promise.all([
        updateMutation.mutateAsync(payload),
        updateBioMutation.mutateAsync({ bio: payload.bio }),
      ]);
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    uploadProfilePicture: (file) => uploadPictureMutation.mutate(file),
  };
}
