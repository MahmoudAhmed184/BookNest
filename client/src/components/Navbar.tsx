import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Logo from "/logo.svg";

import { useAuth } from "../store/AuthContext";
import { getMyProfile } from "../services/userService";

interface NavbarProfile {
  profile_pic?: string | null;
  username?: string | null;
}

const primaryLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/categories", label: "Categories" },
  { to: "/feed", label: "Feed" },
  { to: "/search", label: "Search" },
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

export default function Navbar(): ReactElement {
  const { user, logout } = useAuth();
  const { data: profile } = useQuery<NavbarProfile | null>({
    queryKey: ["user"],
    queryFn: getMyProfile,
    enabled: user,
  });

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

  const profileImage = resolveProfileImage(profile?.profile_pic);
  const profileLabel = profile?.username || "Profile";

  return (
    <header className="sticky top-0 z-50">
      <nav className="w-full border-b border-secondary-gray/40 bg-primary-black/95 py-3 text-primary-white shadow-md backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl focus-visible:outline-accent"
            onClick={closeMenus}
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

          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-primary-white transition-all duration-200 ease-out hover:bg-secondary-black lg:hidden"
            onClick={() => {
              setIsOpen((current) => !current);
              setIsProfileOpen(false);
            }}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            <svg
              className="h-6 w-6 transition-transform duration-200 ease-out"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18 18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>

          <div className="hidden grow items-center gap-6 lg:flex">
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
                  to="/profile/me"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Profile
                </NavLink>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    Login
                  </NavLink>
                  <Link
                    to="/register"
                    className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Register
                  </Link>
                </>
              ) : null}

              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((current) => !current)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-secondary-black p-1 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                    aria-label="Open profile menu"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                    aria-controls="profile-menu"
                  >
                    <span className="profile-image h-10 w-10 overflow-hidden rounded-xl bg-secondary-gray">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={`${profileLabel} avatar`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
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
                    aria-hidden={!isProfileOpen}
                    className={`absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-secondary-black py-2 shadow-xl transition-all duration-200 ease-out ${
                      isProfileOpen
                        ? "scale-100 opacity-100"
                        : "pointer-events-none scale-95 opacity-0"
                    }`}
                  >
                    <Link
                      to="/notifications"
                      role="menuitem"
                      tabIndex={isProfileOpen ? 0 : -1}
                      className="block min-h-[44px] px-4 py-3 text-sm text-primary-white hover:bg-primary-black hover:text-accent"
                      onClick={closeMenus}
                    >
                      Notifications
                    </Link>
                    <Link
                      to="/settings"
                      role="menuitem"
                      tabIndex={isProfileOpen ? 0 : -1}
                      className="block min-h-[44px] px-4 py-3 text-sm text-primary-white hover:bg-primary-black hover:text-accent"
                      onClick={closeMenus}
                    >
                      Settings
                    </Link>
                    <Link
                      to="/"
                      role="menuitem"
                      tabIndex={isProfileOpen ? 0 : -1}
                      className="block min-h-[44px] px-4 py-3 text-sm text-primary-white hover:bg-primary-black hover:text-accent"
                      onClick={() => {
                        closeMenus();
                        logout();
                      }}
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

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
                  onClick={closeMenus}
                >
                  {link.label}
                </NavLink>
              ))}
              {user ? (
                <NavLink
                  to="/profile/me"
                  tabIndex={isOpen ? 0 : -1}
                  className={({ isActive }) => mobileNavLinkClass(isActive)}
                  onClick={closeMenus}
                >
                  Profile
                </NavLink>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-secondary-gray/40 pt-4">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    tabIndex={isOpen ? 0 : -1}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                    onClick={closeMenus}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    tabIndex={isOpen ? 0 : -1}
                    className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-4 py-2 text-sm"
                    onClick={closeMenus}
                  >
                    Register
                  </Link>
                </>
              ) : null}
              {user ? (
                <>
                  <Link
                    to="/notifications"
                    tabIndex={isOpen ? 0 : -1}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                    onClick={closeMenus}
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/settings"
                    tabIndex={isOpen ? 0 : -1}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                    onClick={closeMenus}
                  >
                    Settings
                  </Link>
                  <Link
                    to="/"
                    tabIndex={isOpen ? 0 : -1}
                    className="flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium text-primary-gray hover:bg-secondary-black hover:text-primary-white"
                    onClick={() => {
                      closeMenus();
                      logout();
                    }}
                  >
                    Logout
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
