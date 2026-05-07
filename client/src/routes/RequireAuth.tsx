import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../features/auth/hooks/useAuth";
import { routePaths } from "./paths";

export function RequireAuth(): ReactElement {
  const location = useLocation();
  const { token, user } = useAuth();

  if (!user || !token) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
