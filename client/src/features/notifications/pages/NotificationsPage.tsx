import type { ReactElement } from "react";
import { EmptyState, ErrorState, InlineSpinner } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { routePaths } from "../../../routes/paths";
import { useNotifications } from "../hooks/useNotifications";

const skeletonKeys = ["notification-skeleton-1", "notification-skeleton-2", "notification-skeleton-3"];

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
  const {
    notifications,
    isLoading,
    isFetching,
    isError,
    isMarkingAllAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications(token, Boolean(token));

  const unreadNotifications =
    notifications.filter((notification) => notification.read === false);

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

      {isLoading ? <NotificationsSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Notifications could not be loaded"
          message="We could not load your notifications right now."
          onRetry={refetch}
          isRetrying={isFetching}
        />
      ) : null}

      {!isLoading && !isError && unreadNotifications.length === 0 ? (
        <EmptyState
          title="Nothing new yet"
          description="You're all caught up. New follows, reading updates, and system messages will appear here."
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

      {!isLoading && !isError && unreadNotifications.length > 0 ? (
        <div className="flex flex-col gap-4" role="list">
          {unreadNotifications.map((notification) => (
            <article
              key={notification.id}
              role="listitem"
              className="unread-surface card-lift flex items-start gap-4 rounded-xl p-5 text-primary-white shadow-md"
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

              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-sm leading-relaxed text-primary-white">
                  <strong className="text-accent">System Notification:</strong>{" "}
                  {notification.verb}
                </p>
                <p className="text-xs text-primary-gray">
                  {notification.timestamp}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
