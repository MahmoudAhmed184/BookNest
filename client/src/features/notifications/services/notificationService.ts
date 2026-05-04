import { authHeaders, getData, throwApiError } from "../../../lib/axios";
import type { Notification } from "../types/notification";

export async function getNotifications(
  token: string | null
): Promise<Notification[]> {
  try {
    const response = await getData<Notification[]>("/api/notifications/", {
      headers: authHeaders(token),
    });
    return response;
  } catch (error: unknown) {
    throwApiError(error);
  }
}
