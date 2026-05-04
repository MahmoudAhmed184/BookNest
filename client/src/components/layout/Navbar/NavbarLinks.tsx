import type { ReactElement } from "react";
import { Link, NavLink } from "react-router-dom";

import { routePaths } from "../../../routes/paths";
import { navLinkClass, primaryLinks } from "./navbarUtils";

export interface DesktopLinksProps {
  user: boolean;
}

export function DesktopLinks({ user }: DesktopLinksProps): ReactElement {
  return (
    <div className="flex grow justify-center gap-2">
      {primaryLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {link.label}
        </NavLink>
      ))}
      {user ? (
        <NavLink
          to={routePaths.myProfile}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          Profile
        </NavLink>
      ) : null}
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
        className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg"
      >
        Register
      </Link>
    </>
  );
}
