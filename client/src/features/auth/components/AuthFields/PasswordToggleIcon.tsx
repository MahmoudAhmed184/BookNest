import type { ReactElement } from "react";

export interface PasswordToggleIconProps {
  isVisible?: boolean | undefined;
  className?: string | undefined;
}

export function PasswordToggleIcon({
  isVisible = false,
  className = "h-5 w-5",
}: PasswordToggleIconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isVisible ? (
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}
