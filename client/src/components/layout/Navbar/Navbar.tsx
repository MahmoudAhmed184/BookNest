import { useEffect, useRef, useState, type ReactElement } from "react";

import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useNotifications } from "../../../features/notifications/hooks/useNotifications";
import { useNavbarProfile } from "../../../features/profile/hooks/useNavbarProfile";
import { useScrolled } from "../../../hooks/useScrolled";
import { DesktopLinks, GuestLinks } from "./NavbarLinks";
import { NavbarBrand } from "./NavbarBrand";
import { MobileMenuButton, NavbarMobileMenu } from "./NavbarMobileMenu";
import { NavbarProfileMenu } from "./NavbarProfileMenu";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])";
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden")
  );
}

export function Navbar(): ReactElement {
  const { user, token, logout } = useAuth();
  const { profile } = useNavbarProfile(user, token);
  const { notifications } = useNotifications(token, user && Boolean(token));
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const isScrolled = useScrolled(48);
  const unreadCount = notifications.filter((item) => item.read === false).length;

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
    const focusable = dialog ? getFocusableElements(dialog) : [];
    focusable[0]?.focus();

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
            ? "glass-card rounded-none border-[var(--surface-glass-border)]"
            : "border-secondary-gray/40 bg-primary-black/95 shadow-md"
        }`}
      >
        <div className="container flex items-center justify-between gap-4">
          <NavbarBrand onClick={closeMenus} />
          <MobileMenuButton
            isOpen={isOpen}
            onClick={() => {
              setIsOpen((current) => !current);
              setIsProfileOpen(false);
            }}
          />
          <div className="hidden grow items-center gap-6 lg:flex">
            <DesktopLinks user={user} />
            <div className="flex items-center gap-3">
              {!user ? <GuestLinks /> : null}
              {user ? (
                <NavbarProfileMenu
                  profile={profile}
                  isOpen={isProfileOpen}
                  unreadCount={unreadCount}
                  menuRef={profileMenuRef}
                  onToggle={() => setIsProfileOpen((current) => !current)}
                  onCloseMenus={closeMenus}
                  onLogout={logout}
                />
              ) : null}
            </div>
          </div>
        </div>
        <NavbarMobileMenu
          isOpen={isOpen}
          user={user}
          unreadCount={unreadCount}
          dialogRef={mobileDialogRef}
          onCloseMenus={closeMenus}
          onLogout={logout}
        />
      </nav>
    </header>
  );
}
