import type { ReactElement, RefObject } from "react";
import { NavLink } from "react-router-dom";

import { routePaths } from "../../../routes/paths";
import { MobileAccountLinks } from "./NavbarMobileLinks";
import { NavbarSearch } from "./NavbarSearch";
import { mobileNavLinkClass, primaryLinks } from "./navbarUtils";

export interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileMenuButton({
  isOpen,
  onClick,
}: MobileMenuButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary-white hover:bg-secondary-black lg:hidden"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        )}
      </svg>
    </button>
  );
}

export interface NavbarMobileMenuProps {
  isOpen: boolean;
  user: boolean;
  unreadCount: number;
  dialogRef: RefObject<HTMLDivElement | null>;
  onCloseMenus: () => void;
  onLogout: () => void;
}

export function NavbarMobileMenu({
  isOpen,
  user,
  unreadCount,
  dialogRef,
  onCloseMenus,
  onLogout,
}: NavbarMobileMenuProps): ReactElement {
  return (
    <div
      id="mobile-navigation"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      aria-hidden={!isOpen}
      className={`glass-card fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto p-4 lg:hidden ${
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="flex flex-col gap-4">
        <NavbarSearch onNavigate={onCloseMenus} />
        <div className="flex flex-col gap-2">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              tabIndex={isOpen ? 0 : -1}
              className={({ isActive }) => mobileNavLinkClass(isActive)}
              onClick={onCloseMenus}
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink
                to={routePaths.collections}
                tabIndex={isOpen ? 0 : -1}
                className={({ isActive }) => mobileNavLinkClass(isActive)}
                onClick={onCloseMenus}
              >
                Collections
              </NavLink>
              <NavLink
                to={routePaths.myProfile}
                tabIndex={isOpen ? 0 : -1}
                className={({ isActive }) => mobileNavLinkClass(isActive)}
                onClick={onCloseMenus}
              >
                Profile
              </NavLink>
            </>
          ) : null}
        </div>
        <MobileAccountLinks
          isOpen={isOpen}
          user={user}
          unreadCount={unreadCount}
          onCloseMenus={onCloseMenus}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}
