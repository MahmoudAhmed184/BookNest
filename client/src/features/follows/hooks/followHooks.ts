import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  followUser,
  getFollowStatus,
  getProfileFollowers,
  getProfileFollowing,
  listFollows,
  unfollowById,
} from "../services/followService";
import {
  getNextOffsetPageParam,
  mergeOffsetPages,
  shouldLoadNextOffsetPage,
} from "../../../lib/pagination";
import type { FollowRelationship } from "../types/follow";
import { profileKeys } from "../../profile/hooks/profile.keys";

const profileConnectionsPageSize = 20;

const followKeys = {
  all: ["social"] as const,
  list: () => [...followKeys.all, "list"] as const,
  followersPages: (userId: string | number | undefined) =>
    [...followKeys.all, "followers", userId, "infinite"] as const,
  followingPages: (userId: string | number | undefined) =>
    [...followKeys.all, "following", userId, "infinite"] as const,
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

export function useProfileFollowers(
  userId: string | number | undefined,
  page = 1,
  token?: string | null,
  enabled = true
) {
  const targetPage = Math.max(1, page);
  const query = useInfiniteQuery({
    queryKey: followKeys.followersPages(userId),
    queryFn: ({ pageParam }) =>
      getProfileFollowers(
        userId,
        { page: pageParam, pageSize: profileConnectionsPageSize },
        token
      ),
    enabled: Boolean(userId && enabled),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
  });
  const pages = query.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = query;

  useEffect(() => {
    if (
      !shouldLoadNextOffsetPage({
        targetPage,
        loadedPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
      })
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    loadedPage,
    targetPage,
  ]);

  const data = mergeOffsetPages<FollowRelationship>(
    pages,
    { page: targetPage, pageSize: profileConnectionsPageSize }
  );

  return {
    data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    refetch: () => void query.refetch(),
  };
}

export function useProfileFollowing(
  userId: string | number | undefined,
  page = 1,
  token?: string | null,
  enabled = true
) {
  const targetPage = Math.max(1, page);
  const query = useInfiniteQuery({
    queryKey: followKeys.followingPages(userId),
    queryFn: ({ pageParam }) =>
      getProfileFollowing(
        userId,
        { page: pageParam, pageSize: profileConnectionsPageSize },
        token
      ),
    enabled: Boolean(userId && enabled),
    initialPageParam: 1,
    getNextPageParam: getNextOffsetPageParam,
  });
  const pages = query.data?.pages;
  const loadedPage = pages?.[pages.length - 1]?.page ?? 0;
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage } = query;

  useEffect(() => {
    if (
      !shouldLoadNextOffsetPage({
        targetPage,
        loadedPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
      })
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    loadedPage,
    targetPage,
  ]);

  const data = mergeOffsetPages<FollowRelationship>(
    pages,
    { page: targetPage, pageSize: profileConnectionsPageSize }
  );

  return {
    data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isLoadingMore:
      isFetchingNextPage ||
      (loadedPage > 0 && targetPage > loadedPage && hasNextPage),
    refetch: () => void query.refetch(),
  };
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
