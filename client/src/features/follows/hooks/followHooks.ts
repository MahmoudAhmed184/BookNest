import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  followProfile,
  getMyFollowers,
  getMyFollowing,
  getProfileFollowers,
  getProfileFollowing,
  listFollows,
  unfollowById,
} from "../services/followService";

export const followKeys = {
  all: ["follows"] as const,
  list: () => [...followKeys.all, "list"] as const,
  myFollowers: () => [...followKeys.all, "me", "followers"] as const,
  myFollowing: () => [...followKeys.all, "me", "following"] as const,
  followers: (profileId: string | number | undefined) =>
    [...followKeys.all, "profile", profileId, "followers"] as const,
  following: (profileId: string | number | undefined) =>
    [...followKeys.all, "profile", profileId, "following"] as const,
} as const;

export function useFollows(token?: string | null) {
  return useQuery({
    queryKey: followKeys.list(),
    queryFn: () => listFollows(token),
    enabled: Boolean(token),
  });
}

export function useMyFollowers(token?: string | null) {
  return useQuery({
    queryKey: followKeys.myFollowers(),
    queryFn: () => getMyFollowers(token),
    enabled: Boolean(token),
  });
}

export function useMyFollowing(token?: string | null) {
  return useQuery({
    queryKey: followKeys.myFollowing(),
    queryFn: () => getMyFollowing(token),
    enabled: Boolean(token),
  });
}

export function useProfileFollowers(
  profileId: string | number | undefined,
  token?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: followKeys.followers(profileId),
    queryFn: () => getProfileFollowers(profileId, token),
    enabled: Boolean(profileId && token && enabled),
  });
}

export function useProfileFollowing(
  profileId: string | number | undefined,
  token?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: followKeys.following(profileId),
    queryFn: () => getProfileFollowing(profileId, token),
    enabled: Boolean(profileId && token && enabled),
  });
}

export function useFollowMutations(token?: string | null) {
  const queryClient = useQueryClient();
  const invalidateFollows = (): void => {
    queryClient.invalidateQueries({ queryKey: followKeys.all });
  };
  const followMutation = useMutation({
    mutationFn: (profileId: number) => followProfile(profileId, token),
    onSuccess: invalidateFollows,
  });
  const unfollowMutation = useMutation({
    mutationFn: (followId: number) => unfollowById(followId, token),
    onSuccess: invalidateFollows,
  });

  return {
    followProfile: followMutation.mutateAsync,
    unfollowById: unfollowMutation.mutateAsync,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
