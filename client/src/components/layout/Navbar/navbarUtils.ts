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
}

export const primaryLinks: NavItem[] = [
  { to: routePaths.explore, label: "Explore" },
  { to: routePaths.categories, label: "Categories" },
  { to: routePaths.authors, label: "Authors" },
  { to: routePaths.feed, label: "Feed" },
  { to: routePaths.search, label: "Search" },
];

export function resolveProfileImage(src?: string | null): string | undefined {
  if (!src) return undefined;
  return src.endsWith("image") ? `${src}.svg` : src;
}

export function navLinkClass(isActive: boolean): string {
  return [
    "relative flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-medium",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform after:duration-200",
    isActive
      ? "bg-secondary-black text-primary-white after:scale-x-100"
      : "text-primary-gray hover:text-primary-white after:scale-x-0 hover:after:scale-x-100",
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
