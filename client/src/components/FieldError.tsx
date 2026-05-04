import type { ReactElement } from "react";

interface FieldErrorProps {
  message?: string | undefined;
}

export default function FieldError({ message }: FieldErrorProps): ReactElement | null {
  if (!message) return null;

  return (
    <p className="mt-2 flex items-start gap-2 text-sm text-red-500" role="alert">
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.7 3.2a1.5 1.5 0 0 1 2.6 0l6.5 11.3A1.5 1.5 0 0 1 16.5 17h-13a1.5 1.5 0 0 1-1.3-2.5L8.7 3.2ZM10 7a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </p>
  );
}
