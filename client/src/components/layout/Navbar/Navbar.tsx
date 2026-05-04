import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from "react";
import { Link, NavLink } from "react-router-dom";

import Logo from "/logo.svg";

import { useAuth } from "../../../features/auth/hooks/useAuth";
import { routePaths } from "../../../routes/paths";
import { useNavbarProfile } from "../../../features/profile/hooks/useNavbarProfile";

interface NavbarProfile {
  profile_pic?: string | null;
  username?: string | null;
}

interface NavItem {
  to: string;
  label: string;
}

const primaryLinks: NavItem[] = [
  { to: routePaths.explore, label: "Explore" },
  { to: routePaths.categories, label: "Categories" },
  { to: routePaths.feed, label: "Feed" },
  { to: routePaths.search, label: "Search" },
];

function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

function navLinkClass(isActive: boolean): string {
  return [
    "relative flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform after:duration-200 after:ease-out",
    isActive
      ? "bg-secondary-black text-primary-white after:scale-x-100"
      : "text-primary-gray hover:text-primary-white after:scale-x-0 hover:after:scale-x-100",
  ].join(" ");
}

function mobileNavLinkClass(isActive: boolean): string {
  return [
    "relative flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
    "after:absolute after:inset-y-2 after:left-0 after:w-1 after:origin-top after:rounded-full after:bg-accent after:transition-transform after:duration-200 after:ease-out",
    isActive
      ? "bg-secondary-black text-primary-white after:scale-y-100"
      : "text-primary-gray hover:bg-secondary-black hover:text-primary-white after:scale-y-0 hover:after:scale-y-100",
  ].join(" ");
}

export function Navbar(): ReactElement {
  const { user, logout } = useAuth();
  const { profile } = useNavbarProfile(user);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeMenus = (): void => {
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="w-full border-b border-secondary-gray/40 bg-primary-black/95 py-3 text-primary-white shadow-md backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4">
          <BrandLink onClick={closeMenus} />
          <MobileMenuButton
            isOpen={isOpen}
            onClick={() => {
              setIsOpen((current) => !current);
              setIsProfileOpen(false);
            }}
          />
          <DesktopNavigation
            user={user}
            profile={profile}
            isProfileOpen={isProfileOpen}
            profileMenuRef={profileMenuRef}
            onProfileToggle={() => setIsProfileOpen((current) => !current)}
            onCloseMenus={closeMenus}
            onLogout={logout}
          />
        </div>
        <MobileNavigation
          isOpen={isOpen}
          user={user}
          onCloseMenus={closeMenus}
          onLogout={logout}
        />
      </nav>
    </header>
  );
}

interface BrandLinkProps {
  onClick: () => void;
}

function BrandLink({ onClick }: BrandLinkProps): ReactElement {
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
      <span className="text-2xl text-accent-v bg-clip-text text-transparent font-semibold">
        BookNest
      </span>
    </Link>
  );
}

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

function MobileMenuButton({
  isOpen,
  onClick,
}: MobileMenuButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary-white transition-all duration-200 ease-out hover:bg-secondary-black lg:hidden"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      <svg className="h-6 w-6 transition-transform duration-200 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        )}
      </svg>
    </button>
  );
}

interface DesktopNavigationProps {
  user: boolean;
  profile?: NavbarProfile | null | undefined;
  isProfileOpen: boolean;
  profileMenuRef: RefObject<HTMLDivElement | null>;
  onProfileToggle: () => void;
  onCloseMenus: () => void;
  onLogout: () => void;
}

function DesktopNavigation({
  user,
  profile,
  isProfileOpen,
  profileMenuRef,
  onProfileToggle,
  onCloseMenus,
  onLogout,
}: DesktopNavigationProps): ReactElement {
  return (
    <div className="hidden grow items-center gap-6 lg:flex">
      <div className="flex grow justify-center gap-2">
        {primaryLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => navLinkClass(isActive)}>
            {link.label}
          </NavLink>
        ))}
        {user ? (
          <NavLink to={routePaths.myProfile} className={({ isActive }) => navLinkClass(isActive)}>
            Profile
          </NavLink>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {!user ? <GuestLinks /> : null}
        {user ? (
          <ProfileMenu
            profile={profile}
            isOpen={isProfileOpen}
            menuRef={profileMenuRef}
            onToggle={onProfileToggle}
            onCloseMenus={onCloseMenus}
            onLogout={onLogout}
          />
        ) : null}
      </div>
    </div>
  );
}

function GuestLinks(): ReactElement {
  return (
    <>
      <NavLink to={routePaths.login} className={({ isActive }) => navLinkClass(isActive)}>
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

interface ProfileMenuProps {
  profile?: NavbarProfile | null | undefined;
  isOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onCloseMenus: () => void;
  onLogout: () => void;
}

function ProfileMenu({
  profile,
  isOpen,
  menuRef,
  onToggle,
  onCloseMenus,
  onLogout,
}: ProfileMenuProps): ReactElement {
  const profileImage = resolveProfileImage(profile?.profile_pic);
  const profileLabel = profile?.username || "Profile";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-secondary-black p-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="profile-menu"
      >
        <span className="profile-image h-10 w-10 overflow-hidden rounded-xl bg-secondary-gray">
          {profileImage ? (
            <img src={profileImage} alt={`${profileLabel} avatar`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary-white">
              BN
            </span>
          )}
        </span>
      </button>
      <div
        id="profile-menu"
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-secondary-black py-2 shadow-xl transition-all duration-200 ease-out ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ProfileMenuLink to={routePaths.notifications} isOpen={isOpen} onClick={onCloseMenus}>
          Notifications
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
      className="block min-h-[44px] px-4 py-3 text-sm text-primary-white hover:bg-primary-black hover:text-accent"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

interface MobileNavigationProps {
  isOpen: boolean;
  user: boolean;
  onCloseMenus: () => void;
  onLogout: () => void;
}

function MobileNavigation({
  isOpen,
  user,
  onCloseMenus,
  onLogout,
}: MobileNavigationProps): ReactElement {
  return (
    <div
      id="mobile-navigation"
      aria-hidden={!isOpen}
      className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="container flex flex-col gap-4 pt-4">
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
            <NavLink
              to={routePaths.myProfile}
              tabIndex={isOpen ? 0 : -1}
              className={({ isActive }) => mobileNavLinkClass(isActive)}
              onClick={onCloseMenus}
            >
              Profile
            </NavLink>
          ) : null}
        </div>
        <MobileAuthLinks
          isOpen={isOpen}
          user={user}
          onCloseMenus={onCloseMenus}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

interface MobileAuthLinksProps extends MobileNavigationProps {}

function MobileAuthLinks({
  isOpen,
  user,
  onCloseMenus,
  onLogout,
}: MobileAuthLinksProps): ReactElement {
  return (
    <div className="flex flex-col gap-2 border-t border-secondary-gray/40 pt-4">
      {!user ? (
        <>
          <Link to={routePaths.login} tabIndex={isOpen ? 0 : -1} className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white" onClick={onCloseMenus}>
            Login
          </Link>
          <Link to={routePaths.register} tabIndex={isOpen ? 0 : -1} className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm" onClick={onCloseMenus}>
            Register
          </Link>
        </>
      ) : null}
      {user ? (
        <>
          <MobileAccountLink to={routePaths.notifications} isOpen={isOpen} onClick={onCloseMenus}>
            Notifications
          </MobileAccountLink>
          <MobileAccountLink to={routePaths.settings} isOpen={isOpen} onClick={onCloseMenus}>
            Settings
          </MobileAccountLink>
          <MobileAccountLink
            to={routePaths.root}
            isOpen={isOpen}
            onClick={() => {
              onCloseMenus();
              onLogout();
            }}
          >
            Logout
          </MobileAccountLink>
        </>
      ) : null}
    </div>
  );
}

interface MobileAccountLinkProps {
  to: string;
  isOpen: boolean;
  onClick: () => void;
  children: string;
}

function MobileAccountLink({
  to,
  isOpen,
  onClick,
  children,
}: MobileAccountLinkProps): ReactElement {
  return (
    <Link
      to={to}
      tabIndex={isOpen ? 0 : -1}
      className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
