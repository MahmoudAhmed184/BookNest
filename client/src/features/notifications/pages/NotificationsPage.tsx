import { useMemo, type ReactElement } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { routePaths } from "../../../routes/paths";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationFilters, NotificationType } from "../types/notification";

const skeletonKeys = ["notification-skeleton-1", "notification-skeleton-2", "notification-skeleton-3"];
const readTabs = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
] as const;

type ReadTab = (typeof readTabs)[number]["id"];
const notificationTypeValues = new Set<string>([
  "social",
  "review",
  "rating",
  "collection",
  "recommendation",
  "system",
]);

function NotificationsSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <div key={key} className="rounded-xl bg-secondary-black p-5">
          <div className="mb-3 h-5 w-1/2 rounded-full animate-shimmer" />
          <div className="h-4 w-1/3 rounded-full animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export default function Notifications(): ReactElement {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const readFilter = parseReadFilter(searchParams.get("read"));
  const typeFilter = parseNotificationType(searchParams.get("type"));
  const filters = useMemo<NotificationFilters>(
    () => ({
      is_read:
        readFilter === "all"
          ? undefined
          : readFilter === "read",
      type: typeFilter,
    }),
    [readFilter, typeFilter]
  );
  const {
    notifications,
    notificationTypes,
    isLoading,
    isFetching,
    isError,
    isTypesLoading,
    isMarkingAllAsRead,
    isUpdatingNotification,
    isDeletingNotification,
    markAllAsRead,
    markRead,
    markUnread,
    deleteNotification,
    refetch,
  } = useNotifications(token, Boolean(token), filters);

  const unreadNotifications =
    notifications.filter((notification) => notification.is_read === false);
  const hasFilters = readFilter !== "all" || Boolean(typeFilter);
  const updateFilters = (nextRead: ReadTab, nextType = typeFilter ?? ""): void => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextRead === "all") {
      nextSearchParams.delete("read");
    } else {
      nextSearchParams.set("read", nextRead);
    }
    if (nextType) {
      nextSearchParams.set("type", nextType);
    } else {
      nextSearchParams.delete("type");
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-3">
        <h1 className="display-heading">
          Notifications
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-primary-gray">
          {unreadNotifications.length} unread updates
          {isFetching && notifications ? " · refreshing" : ""}
        </p>
      </header>

      <section className="settings-panel flex flex-col gap-4 p-4 sm:p-5" aria-label="Notification filters">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Read status">
          {readTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={readFilter === tab.id}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold ${
                readFilter === tab.id
                  ? "btn-accent-v text-primary-white"
                  : "bg-primary-black text-primary-gray hover:text-primary-white"
              }`}
              onClick={() => updateFilters(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex max-w-md flex-col gap-2 text-sm font-medium text-primary-white">
          Type
          <select
            value={typeFilter ?? ""}
            onChange={(event) => updateFilters(readFilter, event.target.value)}
            className="field text-primary-white"
            disabled={isTypesLoading}
          >
            <option value="">All types</option>
            {notificationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isLoading ? <NotificationsSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Notifications could not be loaded"
          message="We could not load your notifications right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && notifications.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching notifications" : "No notifications yet"}
          description={
            hasFilters
              ? "Adjust the filters to see more notification history."
              : "New follows, reading updates, and system messages will appear here."
          }
          actionLabel="Browse books"
          actionTo={routePaths.explore}
        />
      ) : null}

      {!isLoading && !isError && unreadNotifications.length > 0 ? (
        <div className="sticky top-24 z-30 flex justify-end">
          <button
            type="button"
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm shadow-md"
            disabled={isMarkingAllAsRead}
            onClick={markAllAsRead}
          >
            {isMarkingAllAsRead ? <InlineSpinner /> : null}
            Mark all as read
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && notifications.length > 0 ? (
        <div className="flex flex-col gap-4" role="list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              role="listitem"
              className={`card-lift flex items-start gap-4 rounded-xl p-5 text-primary-white shadow-md ${
                notification.is_read ? "settings-panel" : "unread-surface"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-black text-accent">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0m6 0H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-sm leading-relaxed text-primary-white">
                  <strong className="text-accent">
                    {notification.notification_type}:
                  </strong>{" "}
                  {notification.action}
                </p>
                {notification.actor_label || notification.target_label ? (
                  <p className="text-xs text-primary-gray">
                    {[notification.actor_label, notification.target_label]
                      .filter(Boolean)
                      .join(" -> ")}
                  </p>
                ) : null}
                <p className="text-xs text-primary-gray">
                  {notification.created_at}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="min-h-[36px] rounded-lg border border-secondary-gray px-3 text-xs font-semibold text-primary-gray hover:border-accent hover:text-primary-white disabled:opacity-50"
                  disabled={isUpdatingNotification}
                  onClick={() =>
                    notification.is_read
                      ? markUnread(notification.id)
                      : markRead(notification.id)
                  }
                >
                  {notification.is_read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  type="button"
                  className="min-h-[36px] rounded-lg px-3 text-xs font-semibold text-primary-gray hover:bg-primary-black hover:text-primary-white disabled:opacity-50"
                  disabled={isDeletingNotification}
                  onClick={() => deleteNotification(notification.id)}
                  aria-label={`Delete notification ${notification.id}`}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function parseReadFilter(value: string | null): ReadTab {
  return value === "read" || value === "unread" ? value : "all";
}

function parseNotificationType(value: string | null): NotificationType | undefined {
  return value && notificationTypeValues.has(value)
    ? (value as NotificationType)
    : undefined;
}
