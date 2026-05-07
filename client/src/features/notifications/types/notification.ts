export interface Notification {
  id: number;
  recipient: number;
  actor_name?: string | null;
  verb: string;
  target_name?: string | null;
  action_object_name?: string | null;
  notification_type_name?: string | null;
  data?: Record<string, unknown>;
  read: boolean;
  timestamp: string;
}

export interface NotificationType {
  id: number;
  name: string;
  description?: string | null;
}

export interface NotificationFilters {
  read?: boolean | undefined;
  type?: string | undefined;
}
