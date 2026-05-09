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
      className="flex min-h-12 shrink-0 items-center gap-3 rounded-full focus-visible:outline-accent"
      onClick={onClick}
      aria-label="BookNest home"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-black/80 shadow-lg ring-1 ring-[var(--surface-glass-border)] transition-transform duration-200 ease-out hover:scale-105">
        <img
          src={Logo}
          alt=""
          className="h-9 w-9 object-contain"
          aria-hidden="true"
        />
      </span>
      <span className="font-display text-3xl font-black leading-none text-primary-white">
        BookNest
      </span>
    </Link>
  );
}
