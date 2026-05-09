import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner } from "../../../components/ui";
import { routePaths } from "../../../routes/paths";
import { useNotifications } from "../hooks/useNotifications";
import type { Notification } from "../types/notification";
import { NotificationIcon } from "./NotificationIcon";
import {
  getNotificationMeta,
  notificationHref,
  notificationMessage,
  relativeNotificationTime,
} from "./notificationPresentation";

interface NotificationBellMenuProps {
  token: string | null;
  unreadCount: number;
}

export function NotificationBellMenu({
  token,
  unreadCount,
}: NotificationBellMenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    isLoading,
    isFetching,
    isError,
    isMarkingAllAsRead,
    markAllAsRead,
    markRead,
    refetch,
  } = useNotifications(token, Boolean(token) && isOpen, { page_size: 6 });

  useEffect(() => {
    if (isOpen) refetch();
  }, [isOpen, refetch]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="relative inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-primary-white/90 transition hover:bg-secondary-black/70 hover:text-primary-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="notification-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-5 text-primary-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div
        id="notification-menu"
        role="menu"
        aria-hidden={!isOpen}
        className={`glass-card absolute right-0 mt-2 w-[min(calc(100vw_-_2rem),26rem)] origin-top-right overflow-hidden p-0 transition-all duration-200 ease-out ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--surface-glass-border)] px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-tight text-primary-white">
              Notifications
            </p>
            <p className="text-xs text-primary-gray" aria-live="polite">
              {unreadCount} unread
              {isFetching ? " · refreshing" : ""}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold text-primary-gray transition hover:bg-primary-black hover:text-primary-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={unreadCount === 0 || isMarkingAllAsRead}
            onClick={markAllAsRead}
          >
            {isMarkingAllAsRead ? <InlineSpinner /> : null}
            Mark all
          </button>
        </div>

        <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-2">
          {isLoading ? <NotificationPreviewSkeleton /> : null}
          {!isLoading && isError ? <NotificationPreviewError /> : null}
          {!isLoading && !isError && notifications.length === 0 ? (
            <NotificationPreviewEmpty />
          ) : null}
          {!isLoading && !isError && notifications.length > 0 ? (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <NotificationPreviewItem
                  key={notification.id}
                  notification={notification}
                  onOpen={() => {
                    if (!notification.is_read) markRead(notification.id);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-[var(--surface-glass-border)] p-2">
          <Link
            to={routePaths.notifications}
            role="menuitem"
            tabIndex={isOpen ? 0 : -1}
            className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 text-sm font-bold text-primary-white transition hover:bg-primary-black hover:text-accent"
            onClick={() => setIsOpen(false)}
          >
            <span>Show all notifications</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotificationPreviewItem({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: () => void;
}): ReactElement {
  const meta = getNotificationMeta(notification);

  return (
    <Link
      to={notificationHref(notification)}
      role="menuitem"
      className={`flex gap-3 rounded-lg px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        notification.is_read
          ? "text-primary-white hover:bg-primary-black"
          : "bg-accent/10 text-primary-white hover:bg-accent/15"
      }`}
      onClick={onOpen}
    >
      <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ${meta.toneClassName}`} aria-hidden="true">
        <NotificationIcon type={notification.notification_type} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-primary-gray">
          {meta.label}
        </span>
        <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 text-primary-white">
          {notificationMessage(notification)}
        </span>
        <span className="mt-1 block text-xs text-primary-gray">
          {relativeNotificationTime(notification.created_at)}
        </span>
      </span>
    </Link>
  );
}

function NotificationPreviewSkeleton(): ReactElement {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {["preview-1", "preview-2", "preview-3"].map((key) => (
        <div key={key} className="flex gap-3 rounded-lg px-3 py-3">
          <div className="h-10 w-10 rounded-lg animate-shimmer" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 rounded-full animate-shimmer" />
            <div className="h-3 w-2/3 rounded-full animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationPreviewError(): ReactElement {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm font-semibold text-primary-white">
        Notifications are unavailable
      </p>
      <p className="mt-1 text-xs leading-5 text-primary-gray">
        Try opening the notifications page.
      </p>
    </div>
  );
}

function NotificationPreviewEmpty(): ReactElement {
  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-primary-black text-accent">
        <BellIcon />
      </div>
      <p className="text-sm font-semibold text-primary-white">No notifications</p>
      <p className="mt-1 text-xs leading-5 text-primary-gray">
        Follows, reviews, ratings, and system messages will appear here.
      </p>
    </div>
  );
}

function BellIcon(): ReactElement {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    </svg>
  );
}
