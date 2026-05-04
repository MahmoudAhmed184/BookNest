import { authHeaders, getApiError, getData, throwApiError } from "../../../lib/axios";
import type { Notification } from "../types/notification";

export async function getNotifications(
  token: string | null
): Promise<Notification[]> {
  console.log(token);

  try {
    const response = await getData<Notification[]>("/api/notifications/", {
      headers: authHeaders(token),
    });
    console.log(response);
    return response;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    console.log(apiError);
    throwApiError(error);
  }
}
