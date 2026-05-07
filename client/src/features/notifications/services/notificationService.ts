import {
  authHeaders,
  getData,
  postData,
  throwApiError,
} from "../../../lib/axios";
import type { Notification } from "../types/notification";

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
  token: string | null
): Promise<Notification[]> {
  try {
    const response = await getData<Notification[]>("/api/v1/notifications/", {
      headers: authHeaders(token),
    });
    return response;
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
