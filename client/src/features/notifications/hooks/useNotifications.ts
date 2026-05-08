import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => getNotifications(token, filters),
    enabled,
  });
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => {
      toast.success("Notifications marked as read.");
      invalidateNotifications();
    },
    onError: () => {
      toast.error("Couldn't mark notifications as read. Try again.");
    },
  });
  const markReadMutation = useMutation({
    mutationFn: (id: number) => markOneRead(id, token),
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't update that notification. Try again.");
    },
  });
  const markUnreadMutation = useMutation({
    mutationFn: (id: number) => markOneUnread(id, token),
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't update that notification. Try again.");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id, token),
    onSuccess: invalidateNotifications,
    onError: () => {
      toast.error("Couldn't delete that notification. Try again.");
    },
  });

  const notifications = notificationsQuery.data || [];
  const notificationTypes = Array.from(
    new Set(notifications.map((notification) => notification.notification_type))
  );

  return {
    notifications,
    notificationTypes,
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
    refetch: () => void notificationsQuery.refetch(),
  };
}
