import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markOneRead,
  markOneUnread,
} from "../services/notificationService";
import type {
  Notification,
  NotificationFilters,
} from "../types/notification";
import { notificationKeys } from "./notifications.keys";

interface UseNotificationsResult {
  notifications: Notification[];
  notificationTypes: string[];
  unreadCount?: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isTypesLoading: boolean;
  isTypesError: boolean;
  isMarkingAllAsRead: boolean;
  isUpdatingNotification: boolean;
  isDeletingNotification: boolean;
  markAllAsRead: () => void;
  markRead: (id: number) => void;
  markUnread: (id: number) => void;
  deleteNotification: (id: number) => void;
  refetch: () => void;
}

interface UseUnreadNotificationCountResult {
  unreadCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useUnreadNotificationCount(
  token: string | null,
  enabled = true
): UseUnreadNotificationCountResult {
  const unreadCountQuery = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(token),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  return {
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: unreadCountQuery.isLoading,
    isFetching: unreadCountQuery.isFetching,
    isError: unreadCountQuery.isError,
    refetch: () => void unreadCountQuery.refetch(),
  };
}

export function useNotifications(
  token: string | null,
  enabled = true,
  filters: NotificationFilters = {}
): UseNotificationsResult {
  const queryClient = useQueryClient();
  const invalidateNotifications = (): void => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => getNotifications(token, filters),
    enabled,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(token),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onMutate: () => {
      setUnreadCountCache(queryClient, 0);
      updateNotificationListCaches(queryClient, (notifications) =>
        notifications.map((notification) => ({ ...notification, is_read: true }))
      );
    },
    onSuccess: () => {
      toast.success("Notifications marked as read.");
      invalidateNotifications();
    },
    onError: () => {
      toast.error("Couldn't mark notifications as read. Try again.");
      invalidateNotifications();
    },
  });
  const markReadMutation = useMutation({
    mutationFn: (id: number) => markOneRead(id, token),
    onMutate: (id) => {
      const wasUnread = getCachedNotification(queryClient, id)?.is_read === false;
      updateNotificationListCaches(queryClient, (notifications) =>
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      if (wasUnread) adjustUnreadCountCache(queryClient, -1);
    },
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't update that notification. Try again.");
      invalidateNotifications();
    },
  });
  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => markOneUnread(id, token),
    onMutate: (id) => {
      const wasRead = getCachedNotification(queryClient, id)?.is_read === true;
      updateNotificationListCaches(queryClient, (notifications) =>
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: false } : notification
        )
      );
      if (wasRead) adjustUnreadCountCache(queryClient, 1);
    },
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't update that notification. Try again.");
      invalidateNotifications();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id, token),
    onMutate: (id) => {
      const wasUnread = getCachedNotification(queryClient, id)?.is_read === false;
      updateNotificationListCaches(queryClient, (notifications) =>
        notifications.filter((notification) => notification.id !== id)
      );
      if (wasUnread) adjustUnreadCountCache(queryClient, -1);
    },
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't delete that notification. Try again.");
      invalidateNotifications();
    },
  });

  const notifications = notificationsQuery.data || [];
  const notificationTypes = Array.from(
    new Set(notifications.map((notification) => notification.notification_type))
  );
  const refetchNotifications = notificationsQuery.refetch;
  const refetchUnreadCount = unreadCountQuery.refetch;
  const refetch = useCallback(() => {
    void refetchNotifications();
    void refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  return {
    notifications,
    notificationTypes,
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading,
    isFetching: notificationsQuery.isFetching,
    isError: notificationsQuery.isError,
    isTypesLoading: false,
    isTypesError: false,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isUpdatingNotification:
      markReadMutation.isPending || markUnreadMutation.isPending,
    isDeletingNotification: deleteMutation.isPending,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    markRead: (id: number) => markReadMutation.mutate(id),
    markUnread: (id: number) => markUnreadMutation.mutate(id),
    deleteNotification: (id: number) => deleteMutation.mutate(id),
    refetch,
  };
}

function updateNotificationListCaches(
  queryClient: QueryClient,
  updater: (notifications: Notification[]) => Notification[]
): void {
  queryClient.setQueriesData<unknown>({ queryKey: notificationKeys.all }, (cached: unknown) => {
    if (!Array.isArray(cached)) return cached;
    return updater(cached as Notification[]);
  });
}

function getCachedNotification(
  queryClient: QueryClient,
  id: number
): Notification | undefined {
  const notificationCaches = queryClient.getQueriesData<unknown>({
    queryKey: notificationKeys.all,
  });

  for (const [, cached] of notificationCaches) {
    if (!Array.isArray(cached)) continue;
    const match = (cached as Notification[]).find((notification) => notification.id === id);
    if (match) return match;
  }

  return undefined;
}

function setUnreadCountCache(queryClient: QueryClient, count: number): void {
  queryClient.setQueryData<number>(notificationKeys.unreadCount(), Math.max(0, count));
}

function adjustUnreadCountCache(queryClient: QueryClient, delta: number): void {
  queryClient.setQueryData<number>(notificationKeys.unreadCount(), (current) =>
    Math.max(0, (current ?? 0) + delta)
  );
}
