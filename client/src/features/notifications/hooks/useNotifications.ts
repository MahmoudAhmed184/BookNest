import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "../services/notificationService";
import type { Notification } from "../types/notification";
import { notificationKeys } from "./notifications.keys";

interface UseNotificationsResult {
  notifications: Notification[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isMarkingAllAsRead: boolean;
  markAllAsRead: () => void;
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
  enabled = true
): UseNotificationsResult {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => getNotifications(token),
    enabled,
  });
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => {
      toast.success("Notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: () => {
      toast.error("Couldn't mark notifications as read. Try again.");
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    isFetching: notificationsQuery.isFetching,
    isError: notificationsQuery.isError,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    refetch: () => void notificationsQuery.refetch(),
  };
}
