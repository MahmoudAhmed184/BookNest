export type NotificationType =
  | "social"
  | "review"
  | "rating"
  | "collection"
  | "recommendation"
  | "system";

export interface Notification {
  id: number;
  recipient: number;
  actor_label?: string | null;
  target_label?: string | null;
  action_object_label?: string | null;
  notification_type: NotificationType;
  action: string;
  payload?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationFilters {
  is_read?: boolean | undefined;
  type?: NotificationType | "" | undefined;
}

export interface UnreadNotificationCountResponse {
  unread_count: number;
}

export interface MarkNotificationsReadResponse {
  updated: number;
}
