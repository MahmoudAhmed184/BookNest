import { routeBuilders, routePaths } from "../../../routes/paths";
import type { Notification, NotificationFilters, NotificationType } from "../types/notification";

export const notificationFilterTabs = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "follow", label: "Follow", type: "social" },
  { id: "review", label: "Review", type: "review" },
  { id: "rating", label: "Rating", type: "rating" },
  { id: "system", label: "System", type: "system" },
] as const;

export type NotificationFilterTab = (typeof notificationFilterTabs)[number]["id"];

export interface NotificationMeta {
  label: string;
  toneClassName: string;
}

const notificationMetaByType: Record<NotificationType, NotificationMeta> = {
  social: {
    label: "Follow",
    toneClassName: "bg-info/15 text-info ring-info/20",
  },
  review: {
    label: "Review",
    toneClassName: "bg-success/15 text-success ring-success/20",
  },
  rating: {
    label: "Rating",
    toneClassName: "bg-warning/15 text-warning ring-warning/20",
  },
  collection: {
    label: "Collection",
    toneClassName: "bg-accent/15 text-accent ring-accent/20",
  },
  recommendation: {
    label: "Recommendation",
    toneClassName: "bg-info/15 text-info ring-info/20",
  },
  system: {
    label: "System",
    toneClassName: "bg-secondary-gray/35 text-primary-white ring-secondary-gray/60",
  },
};

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function notificationFiltersForTab(tab: NotificationFilterTab): NotificationFilters {
  if (tab === "unread") return { is_read: false };
  const filter = notificationFilterTabs.find((item) => item.id === tab);
  return filter && "type" in filter ? { type: filter.type } : {};
}

export function notificationTabFromSearchParams(params: URLSearchParams): NotificationFilterTab {
  if (params.get("read") === "unread") return "unread";

  const type = params.get("type");
  if (type === "social") return "follow";
  if (type === "review" || type === "rating" || type === "system") return type;

  return "all";
}

export function searchParamsForNotificationTab(tab: NotificationFilterTab): URLSearchParams {
  const params = new URLSearchParams();
  if (tab === "unread") {
    params.set("read", "unread");
    return params;
  }

  const filter = notificationFilterTabs.find((item) => item.id === tab);
  if (filter && "type" in filter) {
    params.set("type", filter.type);
  }

  return params;
}

export function getNotificationMeta(notification: Notification): NotificationMeta {
  return notificationMetaByType[notification.notification_type] ?? {
    label: titleCase(notification.notification_type),
    toneClassName: "bg-accent/15 text-accent ring-accent/20",
  };
}

export function notificationMessage(notification: Notification): string {
  const actor = notification.actor_label ?? "BookNest";
  const target = notification.target_label;
  const message = payloadString(notification.payload, "message");

  switch (notification.action) {
    case "followed":
      return `${actor} started following you.`;
    case "review_upvoted":
      return `${actor} upvoted your review${target ? ` on ${target}` : ""}.`;
    case "review_downvoted":
      return `${actor} downvoted your review${target ? ` on ${target}` : ""}.`;
    case "reviewed_book":
      return `${actor} reviewed${target ? ` ${target}` : " a book"}.`;
    case "rated_book":
      return `${actor} rated${target ? ` ${target}` : " a book"}.`;
    case "book_added_to_collection":
      return `${actor} added${target ? ` ${target}` : " a book"} to a collection.`;
    case "collection_shared":
      return `${actor} shared a collection${target ? ` with ${target}` : ""}.`;
    case "recommendation_ready":
      return "Your latest recommendations are ready.";
    case "task_failed":
      return message ?? "A background task needs attention.";
    case "system_message":
      return message ?? "BookNest sent you a system update.";
    default:
      if (!notification.actor_label && !notification.target_label && /\s/.test(notification.action)) {
        return notification.action;
      }
      return `${actor} ${titleCase(notification.action.replaceAll("_", " "))}${target ? ` ${target}` : ""}.`;
  }
}

export function notificationHref(notification: Notification): string {
  const payload = notification.payload ?? {};
  const bookId = payloadNumber(payload, "book_id");
  const collectionId = payloadNumber(payload, "collection_id");
  const followerId = payloadNumber(payload, "follower_id");

  if (bookId) return routeBuilders.book(bookId);
  if (collectionId) return routeBuilders.collection(collectionId);
  if (followerId) return routeBuilders.userProfile(followerId);

  return routePaths.notifications;
}

export function relativeNotificationTime(value: string | undefined): string {
  if (!value) return "just now";

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return value;

  const seconds = Math.round((then - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, amount] of units) {
    if (Math.abs(seconds) >= amount) {
      return relativeFormatter.format(Math.round(seconds / amount), unit);
    }
  }

  return relativeFormatter.format(seconds, "second");
}

function payloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function payloadString(payload: Notification["payload"], key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
