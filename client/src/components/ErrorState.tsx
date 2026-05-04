import type { ComponentProps, ReactElement } from "react";
import { InlineSpinner } from "./InlineSpinner";

interface ErrorStateProps extends ComponentProps<"div"> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this section. Please try again.",
  onRetry,
  isRetrying = false,
  className = "",
  ...divProps
}: ErrorStateProps): ReactElement {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-xl bg-secondary-black p-6 py-12 text-center animate-fade-up ${className}`}
      role="alert"
      {...divProps}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-black text-accent">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 8v5M12 17h.01M10.3 4.5 2.9 17.3A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.7L13.7 4.5a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-primary-white text-balance">
          {title}
        </h2>
        <p className="text-sm text-primary-gray leading-relaxed">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2 text-sm"
        >
          {isRetrying ? <InlineSpinner /> : null}
          Try again
        </button>
      ) : null}
    </div>
  );
}
