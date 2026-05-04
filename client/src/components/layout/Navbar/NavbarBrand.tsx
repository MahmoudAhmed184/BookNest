import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import Logo from "/logo.svg";

import { routePaths } from "../../../routes/paths";

export interface NavbarBrandProps {
  onClick: () => void;
}

export function NavbarBrand({ onClick }: NavbarBrandProps): ReactElement {
  return (
    <Link
      to={routePaths.root}
      className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl focus-visible:outline-accent"
      onClick={onClick}
      aria-label="BookNest home"
    >
      <img
        src={Logo}
        alt="BookNest logo"
        className="h-11 w-11 transition-transform duration-200 ease-out hover:scale-105"
      />
      <span className="text-accent-v bg-clip-text text-2xl font-semibold text-transparent">
        BookNest
      </span>
    </Link>
  );
}
