import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { InlineSpinner } from "../../../../components/ui";

export interface AuthSubmitButtonProps {
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel: string;
}

export function AuthSubmitButton({
  isSubmitting,
  idleLabel,
  submittingLabel,
}: AuthSubmitButtonProps): ReactElement {
  return (
    <button
      type="submit"
      className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center gap-2"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? <InlineSpinner /> : null}
      {isSubmitting ? submittingLabel : idleLabel}
    </button>
  );
}

export interface AuthNavLinkProps {
  to: string;
  children: string;
}

export function AuthNavLink({ to, children }: AuthNavLinkProps): ReactElement {
  return (
    <Link
      to={to}
      className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center text-center"
    >
      {children}
    </Link>
  );
}
