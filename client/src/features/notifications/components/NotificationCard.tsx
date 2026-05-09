import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner } from "../../../components/ui";
import type { Notification } from "../types/notification";
import { NotificationIcon } from "./NotificationIcon";
import {
  getNotificationMeta,
  notificationHref,
  notificationMessage,
  relativeNotificationTime,
} from "./notificationPresentation";

interface NotificationCardProps {
  notification: Notification;
  isUpdating?: boolean | undefined;
  isDeleting?: boolean | undefined;
  onMarkRead: (id: number) => void;
  onMarkUnread: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationCard({
  notification,
  isUpdating = false,
  isDeleting = false,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: NotificationCardProps): ReactElement {
  const meta = getNotificationMeta(notification);
  const message = notificationMessage(notification);
  const href = notificationHref(notification);

  return (
    <article
      role="listitem"
      className={`group relative overflow-hidden rounded-xl border p-4 text-primary-white shadow-md transition duration-200 ease-out sm:p-5 ${
        notification.is_read
          ? "border-[var(--surface-glass-border)] bg-[var(--surface-panel)] hover:bg-secondary-black/80"
          : "border-accent/45 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_14%,transparent),color-mix(in_srgb,var(--surface-panel-strong)_86%,transparent))]"
      }`}
    >
      {!notification.is_read ? (
        <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-accent" aria-hidden="true" />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link
          to={href}
          className="flex min-w-0 flex-1 gap-3 rounded-lg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${meta.toneClassName}`} aria-hidden="true">
            <NotificationIcon type={notification.notification_type} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-gray">
                {meta.label}
              </span>
              {!notification.is_read ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary-black">
                  New
                </span>
              ) : null}
            </span>
            <span className="block text-sm font-semibold leading-6 text-primary-white sm:text-base">
              {message}
            </span>
            {notification.action_object_label && notification.action_object_label !== notification.target_label ? (
              <span className="mt-1 block text-xs leading-5 text-primary-gray">
                {notification.action_object_label}
              </span>
            ) : null}
            <span className="mt-2 block text-xs text-primary-gray">
              {relativeNotificationTime(notification.created_at)}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-secondary-gray/70 px-3 py-2 text-xs font-bold text-primary-gray transition hover:border-accent hover:bg-primary-black hover:text-primary-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isUpdating}
            onClick={() =>
              notification.is_read
                ? onMarkUnread(notification.id)
                : onMarkRead(notification.id)
            }
          >
            {isUpdating ? <InlineSpinner /> : null}
            {notification.is_read ? "Mark unread" : "Mark read"}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-primary-gray transition hover:bg-primary-black hover:text-primary-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isDeleting}
            onClick={() => onDelete(notification.id)}
            aria-label={`Delete notification ${notification.id}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
