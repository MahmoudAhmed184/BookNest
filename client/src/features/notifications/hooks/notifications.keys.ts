import type { NotificationFilters } from "../types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters: NotificationFilters = {}) =>
    [...notificationKeys.all, "list", filters] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
