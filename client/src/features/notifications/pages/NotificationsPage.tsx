import { useMemo, type ReactElement } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { routePaths } from "../../../routes/paths";
import { NotificationCard } from "../components/NotificationCard";
import {
  notificationFilterTabs,
  notificationFiltersForTab,
  notificationTabFromSearchParams,
  relativeNotificationTime,
  searchParamsForNotificationTab,
  type NotificationFilterTab,
} from "../components/notificationPresentation";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationFilters } from "../types/notification";

const skeletonKeys = [
  "notification-skeleton-1",
  "notification-skeleton-2",
  "notification-skeleton-3",
  "notification-skeleton-4",
];

function NotificationsSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      {skeletonKeys.map((key) => (
        <div key={key} className="rounded-xl border border-[var(--surface-glass-border)] bg-[var(--surface-panel)] p-5">
          <div className="mb-4 flex gap-3">
            <div className="h-12 w-12 rounded-xl animate-shimmer" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 rounded-full animate-shimmer" />
              <div className="h-5 w-3/4 rounded-full animate-shimmer" />
              <div className="h-3 w-32 rounded-full animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Notifications(): ReactElement {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = notificationTabFromSearchParams(searchParams);
  const filters = useMemo<NotificationFilters>(
    () => ({
      ...notificationFiltersForTab(activeTab),
      page_size: 100,
    }),
    [activeTab]
  );
  const {
    notifications,
    unreadCount: remoteUnreadCount,
    isLoading,
    isFetching,
    isError,
    isMarkingAllAsRead,
    isUpdatingNotification,
    isDeletingNotification,
    markAllAsRead,
    markRead,
    markUnread,
    deleteNotification,
    refetch,
  } = useNotifications(token, Boolean(token), filters);

  const localUnreadCount = notifications.filter((notification) => !notification.is_read).length;
  const unreadCount = remoteUnreadCount ?? localUnreadCount;
  const latestActivity = notifications[0]?.created_at
    ? relativeNotificationTime(notifications[0].created_at)
    : "No activity";
  const hasFilters = activeTab !== "all";

  const updateTab = (tab: NotificationFilterTab): void => {
    setSearchParams(searchParamsForNotificationTab(tab), { replace: true });
  };

  return (
    <div className="flex flex-col gap-8 py-12 animate-fade-up">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Reader activity
          </p>
          <h1 className="display-heading">Notifications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-gray">
            Follows, reviews, ratings, and account updates are grouped here so unread activity stays easy to scan.
            {isFetching && !isLoading ? " Refreshing..." : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-secondary-gray/70 px-3 text-sm font-bold text-primary-gray transition hover:border-accent hover:bg-primary-black hover:text-primary-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isFetching}
            onClick={refetch}
            aria-label="Refresh notifications"
            aria-busy={isFetching}
          >
            {isFetching ? <InlineSpinner /> : <RefreshIcon />}
          </button>
          <button
            type="button"
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm shadow-md"
            disabled={unreadCount === 0 || isMarkingAllAsRead}
            onClick={markAllAsRead}
          >
            {isMarkingAllAsRead ? <InlineSpinner /> : null}
            Mark all read
          </button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Notification summary">
        <SummaryTile label="Unread" value={String(unreadCount)} tone="accent" icon={<BellIcon />} />
        <SummaryTile label="Showing" value={String(notifications.length)} tone="info" icon={<InboxIcon />} />
        <SummaryTile label="Latest" value={latestActivity} tone="muted" icon={<ClockIcon />} />
      </section>

      <section className="settings-panel p-2" aria-label="Notification filters">
        <div className="flex max-w-full gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Notification filters">
          {notificationFilterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-accent text-primary-black shadow-md"
                  : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
              }`}
              onClick={() => updateTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.id === "unread" && unreadCount > 0 ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activeTab === tab.id ? "bg-primary-black text-accent" : "bg-accent text-primary-black"}`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
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
          title={hasFilters ? "No matching notifications" : "No notifications"}
          description={
            hasFilters
              ? "Adjust the filters to see more notification history."
              : "Follows, reviews, ratings, and system messages will appear here."
          }
          actionLabel="Browse books"
          actionTo={routePaths.explore}
          icon={<EmptyNotificationIcon />}
          className="rounded-xl border border-dashed border-[var(--surface-glass-border)] bg-[var(--surface-panel)] px-4"
        />
      ) : null}

      {!isLoading && !isError && notifications.length > 0 ? (
        <div className="flex flex-col gap-3" role="list">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isUpdating={isUpdatingNotification}
              isDeleting={isDeletingNotification}
              onMarkRead={markRead}
              onMarkUnread={markUnread}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactElement;
  tone: "accent" | "info" | "muted";
}): ReactElement {
  return (
    <div className="settings-panel flex min-w-0 items-center gap-3 p-4">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${
          tone === "accent"
            ? "bg-accent/15 text-accent ring-accent/20"
            : tone === "info"
              ? "bg-info/15 text-info ring-info/20"
              : "bg-secondary-gray/35 text-primary-gray ring-secondary-gray/60"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-gray">
          {label}
        </p>
        <p className="truncate text-lg font-black text-primary-white">{value}</p>
      </div>
    </div>
  );
}

function BellIcon(): ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    </svg>
  );
}

function InboxIcon(): ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="m5.5 5.1-3.4 7.3A2 2 0 0 0 4 15h16a2 2 0 0 0 1.8-2.7l-3.4-7.2A2 2 0 0 0 16.6 4H7.4a2 2 0 0 0-1.9 1.1Z" />
      <path d="M6 15v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ClockIcon(): ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
      <path d="M12 6v6l4 2" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function RefreshIcon(): ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function EmptyNotificationIcon(): ReactElement {
  return (
    <svg className="h-16 w-16 text-accent" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M30 70h36M38 78h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M66 39a18 18 0 1 0-36 0c0 19-8 20-8 26h52c0-6-8-7-8-26Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M41 70a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
