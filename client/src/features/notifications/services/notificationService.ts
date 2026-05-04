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
