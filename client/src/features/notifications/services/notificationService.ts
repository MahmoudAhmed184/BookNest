import {
  authHeaders,
  deleteData,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import { normalizeEmptyResponse } from "../../../lib/normalizers";
import type {
  MarkNotificationsReadResponse,
  Notification,
  NotificationFilters,
  UnreadNotificationCountResponse,
} from "../types/notification";

export async function getUnreadNotificationCount(
  token: string | null
): Promise<number> {
  try {
    const response = await getData<UnreadNotificationCountResponse>(
      "/api/v1/notification-counts/unread/",
      { headers: authHeaders(token) }
    );
    return response.unread_count;
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function getNotifications(
  token: string | null,
  filters: NotificationFilters = {}
): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (typeof filters.is_read === "boolean") {
    params.set("is_read", String(filters.is_read));
  }
  if (filters.type) {
    params.set("type", filters.type);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";

  try {
    return await getData<Notification[]>(`/api/v1/notifications/${query}`, {
      headers: authHeaders(token),
    });
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function markOneRead(
  id: number,
  token: string | null
): Promise<Notification> {
  try {
    return await postData<Notification, Record<string, never>>(
      `/api/v1/notifications/${id}/read/`,
      {},
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}

export async function markOneUnread(
  id: number,
  token: string | null
): Promise<Notification> {
  try {
    return await postData<Notification, Record<string, never>>(
      `/api/v1/notifications/${id}/unread/`,
      {},
      { headers: authHeaders(token) }
    );
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
    return await postData<MarkNotificationsReadResponse, Record<string, never>>(
      "/api/v1/notifications/mark-all-read/",
      {},
      { headers: authHeaders(token) }
    );
  } catch (error: unknown) {
    throwApiError(error);
  }
}
