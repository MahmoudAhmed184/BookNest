import {
  authHeaders,
  deleteData,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import { normalizeEmptyResponse } from "../../../lib/normalizers";
import type {
  Notification,
  NotificationFilters,
  NotificationType,
} from "../types/notification";

export interface MarkNotificationsReadResponse {
  updated: number;
}

export interface UnreadNotificationCountResponse {
  count: number;
}

export async function getUnreadNotificationCount(
  token: string | null
): Promise<number> {
  try {
    const response = await getData<UnreadNotificationCountResponse>(
      "/api/v1/notification-counts/unread/",
      {
        headers: authHeaders(token),
      }
    );
    return response.count;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getNotifications(
  token: string | null,
  filters: NotificationFilters = {}
): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (typeof filters.read === "boolean") {
    params.set("read", String(filters.read));
  }
  if (filters.type) {
    params.set("type", filters.type);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";

  try {
    const response = await getData<Notification[]>(
      `/api/v1/notifications/${query}`,
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getNotificationTypes(
  token: string | null
): Promise<NotificationType[]> {
  try {
    const response = await getData<NotificationType[]>(
      "/api/v1/notification-types/",
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function markOneRead(
  id: number,
  token: string | null
): Promise<Notification> {
  try {
    const response = await postData<Notification, Record<string, never>>(
      `/api/v1/notifications/${id}/read/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function markOneUnread(
  id: number,
  token: string | null
): Promise<Notification> {
  try {
    const response = await postData<Notification, Record<string, never>>(
      `/api/v1/notifications/${id}/unread/`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function deleteNotification(
  id: number,
  token: string | null
): Promise<void> {
  try {
    await deleteData<void>(`/api/v1/notifications/${id}/`, {
      headers: authHeaders(token),
    });
    return normalizeEmptyResponse();
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function markAllNotificationsRead(
  token: string | null
): Promise<MarkNotificationsReadResponse> {
  try {
    const response = await postData<MarkNotificationsReadResponse, Record<string, never>>(
      "/api/v1/notifications/mark-all-read/",
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
