import { useEffect, useRef, useState, type ReactElement } from "react";

import { useAuth } from "../../../features/auth/hooks/useAuth";
import { NotificationBellMenu } from "../../../features/notifications/components/NotificationBellMenu";
import { useUnreadNotificationCount } from "../../../features/notifications/hooks/useNotifications";
import { useNavbarProfile } from "../../../features/profile/hooks/useNavbarProfile";
import { useScrolled } from "../../../hooks/useScrolled";
import { useThemeMode } from "../../../hooks/useThemeMode";
import { DesktopLinks, GuestLinks } from "./NavbarLinks";
import { NavbarBrand } from "./NavbarBrand";
import { MobileMenuButton, NavbarMobileMenu } from "./NavbarMobileMenu";
import { NavbarProfileMenu } from "./NavbarProfileMenu";
import { NavbarSearch } from "./NavbarSearch";
import { NavbarThemeToggle } from "./NavbarThemeToggle";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])";
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden")
  );
}

export function Navbar(): ReactElement {
  const { user, token, logout } = useAuth();
  const { profile } = useNavbarProfile(user, token);
  const { unreadCount } = useUnreadNotificationCount(
    token,
    user && Boolean(token)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const isScrolled = useScrolled(48);
  const { theme, toggleTheme } = useThemeMode();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = mobileDialogRef.current;
    dialog?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsProfileOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const elements = getFocusableElements(dialog);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const closeMenus = (): void => {
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50">
      <nav
        className={`w-full border-b py-3 text-primary-white transition-all duration-200 ease-out ${
          isScrolled
            ? "border-[var(--surface-glass-border)] bg-primary-black/90 shadow-xl backdrop-blur-xl"
            : "border-secondary-gray/40 bg-primary-black/95 shadow-md"
        }`}
      >
        <div className="container flex min-h-16 items-center gap-4 xl:gap-6">
          <NavbarBrand onClick={closeMenus} />
          <NavbarSearch className="hidden min-w-0 flex-1 md:block lg:max-w-[44rem] xl:max-w-[58rem]" />
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {user ? (
              <NotificationBellMenu token={token} unreadCount={unreadCount} />
            ) : null}
            <MobileMenuButton
              isOpen={isOpen}
              onClick={() => {
                setIsOpen((current) => !current);
                setIsProfileOpen(false);
              }}
            />
          </div>
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <DesktopLinks isAuthenticated={user} />
            {!user ? <GuestLinks /> : null}
            <NavbarThemeToggle theme={theme} onToggle={toggleTheme} />
            {user ? (
              <>
                <NotificationBellMenu
                  token={token}
                  unreadCount={unreadCount}
                />
                <NavbarProfileMenu
                  profile={profile}
                  isOpen={isProfileOpen}
                  menuRef={profileMenuRef}
                  onToggle={() => setIsProfileOpen((current) => !current)}
                  onCloseMenus={closeMenus}
                  onLogout={logout}
                />
              </>
            ) : null}
          </div>
        </div>
        <NavbarMobileMenu
          isOpen={isOpen}
          user={user}
          unreadCount={unreadCount}
          theme={theme}
          dialogRef={mobileDialogRef}
          onCloseMenus={closeMenus}
          onLogout={logout}
          onToggleTheme={toggleTheme}
        />
      </nav>
    </header>
  );
}
