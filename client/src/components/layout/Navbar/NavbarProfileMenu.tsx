import { useEffect, useState, type ReactElement, type RefObject } from "react";
import { Link } from "react-router-dom";

import { routePaths } from "../../../routes/paths";
import { getFallbackHueStyle, getInitials } from "../../../utils/colorFromString";
import { getUserDisplayName } from "../../../features/profile/utils/profileDisplay";
import { resolveProfileImage, type NavbarProfile } from "./navbarUtils";

export interface NavbarProfileMenuProps {
  profile?: NavbarProfile | null | undefined;
  isOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onCloseMenus: () => void;
  onLogout: () => void;
}

export function NavbarProfileMenu({
  profile,
  isOpen,
  menuRef,
  onToggle,
  onCloseMenus,
  onLogout,
}: NavbarProfileMenuProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);
  const profileImage = resolveProfileImage(
    profile?.picture || profile?.picture_fallback_url
  );
  const profileLabel = getUserDisplayName(profile?.user, "Profile");
  const canShowImage = Boolean(profileImage) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [profileImage]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-secondary-black/80 p-1 hover:-translate-y-0.5 hover:shadow-lg"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="profile-menu"
      >
        <span className="h-10 w-10 overflow-hidden rounded-full bg-secondary-gray">
          {canShowImage ? (
            <img
              src={profileImage}
              alt={`${profileLabel} avatar`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <span
              className="fallback-gradient flex h-full w-full items-center justify-center text-sm font-bold text-primary-white"
              style={getFallbackHueStyle(profileLabel)}
            >
              {getInitials(profileLabel)}
            </span>
          )}
        </span>
      </button>
      <div
        id="profile-menu"
        role="menu"
        aria-hidden={!isOpen}
        className={`glass-card absolute right-0 mt-2 w-60 origin-top-right py-2 transition-all duration-200 ease-out ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ProfileMenuLink to={routePaths.myProfile} isOpen={isOpen} onClick={onCloseMenus}>
          Profile
        </ProfileMenuLink>
        <ProfileMenuLink to={routePaths.settings} isOpen={isOpen} onClick={onCloseMenus}>
          Settings
        </ProfileMenuLink>
        <ProfileMenuLink
          to={routePaths.root}
          isOpen={isOpen}
          onClick={() => {
            onCloseMenus();
            onLogout();
          }}
        >
          Logout
        </ProfileMenuLink>
      </div>
    </div>
  );
}

interface ProfileMenuLinkProps {
  to: string;
  isOpen: boolean;
  onClick: () => void;
  children: string;
}

function ProfileMenuLink({
  to,
  isOpen,
  onClick,
  children,
}: ProfileMenuLinkProps): ReactElement {
  return (
    <Link
      to={to}
      role="menuitem"
      tabIndex={isOpen ? 0 : -1}
      className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3 text-sm text-primary-white hover:bg-primary-black hover:text-accent"
      onClick={onClick}
    >
      <span>{children}</span>
    </Link>
  );
}
