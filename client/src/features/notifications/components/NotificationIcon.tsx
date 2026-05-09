import type { ReactElement } from "react";
import type { NotificationType } from "../types/notification";

interface NotificationIconProps {
  type: NotificationType;
  className?: string | undefined;
}

export function NotificationIcon({
  type,
  className = "h-5 w-5",
}: NotificationIconProps): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      {iconPath(type)}
    </svg>
  );
}

function iconPath(type: NotificationType): ReactElement {
  switch (type) {
    case "social":
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </>
      );
    case "review":
      return (
        <>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
          <path d="M8 8h8" />
          <path d="M8 12h6" />
        </>
      );
    case "rating":
      return <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />;
    case "collection":
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M9 6h7" />
        </>
      );
    case "recommendation":
      return (
        <>
          <path d="m12 3 1.4 4.1L17.5 8l-4.1 1.4L12 13.5l-1.4-4.1L6.5 8l4.1-1.4L12 3Z" />
          <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
          <path d="M5 14h5" />
          <path d="M5 18h8" />
        </>
      );
    case "system":
      return (
        <>
          <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        </>
      );
  }
}
