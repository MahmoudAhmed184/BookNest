import { routePaths } from "../../../routes/paths";

export interface NavbarProfile {
  picture?: string | null;
  picture_fallback_url?: string | null;
  handle?: string | null;
  user?: {
    display_name?: string | null;
  };
}

export interface NavItem {
  to: string;
  label: string;
  authRequired?: boolean;
}

export const primaryLinks = [
  { to: routePaths.explore, label: "Explore" },
  { to: routePaths.feed, label: "Feed", authRequired: true },
] satisfies NavItem[];

export function getPrimaryLinks(isAuthenticated: boolean): NavItem[] {
  return primaryLinks.filter((link) => !link.authRequired || isAuthenticated);
}

export function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

export function navLinkClass(isActive: boolean): string {
  return [
    "inline-flex min-h-12 items-center rounded-full px-4 py-2 text-sm font-bold",
    isActive
      ? "bg-secondary-black/80 text-primary-white"
      : "text-primary-white/90 hover:bg-secondary-black/70 hover:text-primary-white",
  ].join(" ");
}

export function mobileNavLinkClass(isActive: boolean): string {
  return [
    "relative flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-medium",
    "after:absolute after:inset-y-2 after:left-0 after:w-1 after:origin-top after:rounded-full after:bg-accent after:transition-transform after:duration-200",
    isActive
      ? "bg-secondary-black text-primary-white after:scale-y-100"
      : "text-primary-gray hover:bg-secondary-black hover:text-primary-white after:scale-y-0 hover:after:scale-y-100",
  ].join(" ");
}
