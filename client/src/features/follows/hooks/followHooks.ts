import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  followUser,
  getFollowStatus,
  getMyFollowers,
  getMyFollowing,
  getProfileFollowers,
  getProfileFollowing,
  listFollows,
  unfollowById,
} from "../services/followService";
import { profileKeys } from "../../profile/hooks/profile.keys";

export const followKeys = {
  all: ["social"] as const,
  list: () => [...followKeys.all, "list"] as const,
  myFollowers: () => [...followKeys.all, "me", "followers"] as const,
  myFollowing: () => [...followKeys.all, "me", "following"] as const,
  followers: (userId: string | number | undefined, page = 1) =>
    [...followKeys.all, "followers", userId, page] as const,
  following: (userId: string | number | undefined, page = 1) =>
    [...followKeys.all, "following", userId, page] as const,
  status: (userId: string | number | undefined) =>
    [...followKeys.all, "status", userId] as const,
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
  userId: string | number | undefined,
  page = 1,
  token?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: followKeys.followers(userId, page),
    queryFn: () => getProfileFollowers(userId, { page, pageSize: 20 }, token),
    enabled: Boolean(userId && enabled),
  });
}

export function useProfileFollowing(
  userId: string | number | undefined,
  page = 1,
  token?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: followKeys.following(userId, page),
    queryFn: () => getProfileFollowing(userId, { page, pageSize: 20 }, token),
    enabled: Boolean(userId && enabled),
  });
}

export function useFollowStatus(
  userId: string | number | undefined,
  token?: string | null
) {
  return useQuery({
    queryKey: followKeys.status(userId),
    queryFn: () => getFollowStatus(userId, token),
    enabled: Boolean(userId && token),
  });
}

export function useFollowMutations(token?: string | null) {
  const queryClient = useQueryClient();
  const invalidateFollows = (): void => {
    queryClient.invalidateQueries({ queryKey: followKeys.all });
    queryClient.invalidateQueries({ queryKey: profileKeys.all });
  };
  const followMutation = useMutation({
    mutationFn: (userId: number) => followUser(userId, token),
    onSuccess: invalidateFollows,
  });
  const unfollowMutation = useMutation({
    mutationFn: (followId: number) => unfollowById(followId, token),
    onSuccess: invalidateFollows,
  });

  return {
    followUser: followMutation.mutateAsync,
    unfollowById: unfollowMutation.mutateAsync,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
