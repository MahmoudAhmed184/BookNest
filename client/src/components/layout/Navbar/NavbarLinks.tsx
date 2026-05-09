import type { ReactElement } from "react";
import { Link, NavLink } from "react-router-dom";

import { routePaths } from "../../../routes/paths";
import { getPrimaryLinks, navLinkClass } from "./navbarUtils";

interface DesktopLinksProps {
  isAuthenticated: boolean;
}

export function DesktopLinks({ isAuthenticated }: DesktopLinksProps): ReactElement {
  return (
    <div className="flex items-center gap-3">
      {getPrimaryLinks(isAuthenticated).map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

export function GuestLinks(): ReactElement {
  return (
    <>
      <NavLink
        to={routePaths.login}
        className={({ isActive }) => navLinkClass(isActive)}
      >
        Login
      </NavLink>
      <Link
        to={routePaths.register}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 py-2 text-sm font-bold text-primary-black shadow-md hover:bg-primary-white hover:shadow-lg"
      >
        Register
      </Link>
    </>
  );
}
