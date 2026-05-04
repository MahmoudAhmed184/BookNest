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
      className="h-20 w-20 text-accent"
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 24c10-5 20-5 30 1v50c-10-6-20-6-30-1V24Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M48 25c10-6 20-6 30-1v50c-10-5-20-5-30 1V25Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M28 36h10M28 46h12M58 36h10M58 46h8"
        stroke="currentColor"
        strokeWidth="3"
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
    "btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 py-16 text-center animate-fade-up ${className}`}
      {...divProps}
    >
      <div className="glass-card flex h-28 w-28 items-center justify-center rounded-full">
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

export type { EmptyStateProps };
