import { useQuery } from "@tanstack/react-query";

import { getNotifications } from "../../../services/notificationService";
import type { Notification } from "../../../types/notification";
import { profileKeys } from "./profile.keys";

interface UseNotificationsResult {
  notifications: Notification[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useNotifications(token: string | null): UseNotificationsResult {
  const notificationsQuery = useQuery({
    queryKey: profileKeys.notifications(),
    queryFn: () => getNotifications(token),
  });

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    isFetching: notificationsQuery.isFetching,
    isError: notificationsQuery.isError,
    refetch: () => void notificationsQuery.refetch(),
  };
}
