import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { routePaths } from "../../../routes/paths";

export interface MobileAccountLinksProps {
  isOpen: boolean;
  user: boolean;
  unreadCount: number;
  onCloseMenus: () => void;
  onLogout: () => void;
}

export function MobileAccountLinks({
  isOpen,
  user,
  unreadCount,
  onCloseMenus,
  onLogout,
}: MobileAccountLinksProps): ReactElement {
  if (!user) {
    return (
      <div className="flex flex-col gap-2 border-t border-secondary-gray/40 pt-4">
        <MobileLink to={routePaths.login} isOpen={isOpen} onClick={onCloseMenus}>
          Login
        </MobileLink>
        <MobileLink to={routePaths.register} isOpen={isOpen} onClick={onCloseMenus} accent>
          Register
        </MobileLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-secondary-gray/40 pt-4">
      <MobileLink to={routePaths.notifications} isOpen={isOpen} onClick={onCloseMenus} badge={unreadCount}>
        Notifications
      </MobileLink>
      <MobileLink to={routePaths.settings} isOpen={isOpen} onClick={onCloseMenus}>
        Settings
      </MobileLink>
      <MobileLink
        to={routePaths.root}
        isOpen={isOpen}
        onClick={() => {
          onCloseMenus();
          onLogout();
        }}
      >
        Logout
      </MobileLink>
    </div>
  );
}

interface MobileLinkProps {
  to: string;
  isOpen: boolean;
  onClick: () => void;
  children: string;
  accent?: boolean | undefined;
  badge?: number | undefined;
}

function MobileLink({
  to,
  isOpen,
  onClick,
  children,
  accent = false,
  badge = 0,
}: MobileLinkProps): ReactElement {
  return (
    <Link
      to={to}
      tabIndex={isOpen ? 0 : -1}
      className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm font-medium ${
        accent
          ? "btn btn-accent-v justify-center text-primary-white"
          : "text-primary-gray hover:bg-secondary-black hover:text-primary-white"
      }`}
      onClick={onClick}
    >
      <span>{children}</span>
      {badge > 0 ? (
        <span
          className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary-black"
          aria-label={`${badge} unread notifications`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
