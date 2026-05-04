import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps extends ComponentProps<"div"> {
  title: string;
  description: string;
  actionLabel?: string | undefined;
  actionTo?: string | undefined;
  onAction?: () => void;
  icon?: ReactNode | undefined;
}

function DefaultIcon(): ReactElement {
  return (
    <svg
      className="h-12 w-12 text-accent"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 9h19a5 5 0 0 1 5 5v25H17a4 4 0 0 1-4-4V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M17 39a4 4 0 0 1 0-8h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 16h10M20 22h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon = <DefaultIcon />,
  className = "",
  ...divProps
}: EmptyStateProps): ReactElement {
  const actionClasses =
    "btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-up ${className}`}
      {...divProps}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-black">
        {icon}
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-primary-white text-balance">
          {title}
        </h2>
        <p className="text-sm text-primary-gray leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className={actionClasses}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionTo ? (
        <button type="button" onClick={onAction} className={actionClasses}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
