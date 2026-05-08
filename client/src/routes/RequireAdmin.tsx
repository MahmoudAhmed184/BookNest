import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ErrorState } from "../components/ui";
import { useAuth } from "../features/auth/hooks/useAuth";
import { routePaths } from "./paths";

export function RequireAdmin(): ReactElement {
  const location = useLocation();
  const { authUser, token, user } = useAuth();

  if (!user || !token) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!authUser) {
    return (
      <div className="py-12" role="status" aria-live="polite">
        <p className="text-sm text-primary-gray">Checking admin access...</p>
      </div>
    );
  }

  if (!authUser.is_staff) {
    return (
      <div className="py-12">
        <ErrorState
          title="Admin access required"
          message="Your account does not have permission to view this page."
        />
      </div>
    );
  }

  return <Outlet />;
}
