import type { ComponentProps, ReactElement } from "react";
import { Link } from "react-router-dom";
import Logo from "/logo.svg";
import { routePaths } from "../../../routes/paths";

type FooterProps = ComponentProps<"footer">;

const footerLinks = [
  { to: routePaths.explore, label: "Explore" },
  { to: routePaths.genres, label: "Genres" },
  { to: routePaths.search, label: "Search" },
] as const;

const socialLinks = ["Instagram", "Threads", "RSS"] as const;

export function Footer({ className = "", ...footerProps }: FooterProps): ReactElement {
  return (
    <footer className={`mt-16 border-t border-secondary-gray/40 bg-secondary-black/70 ${className}`} {...footerProps}>
      <div className="container grid gap-8 py-10 text-primary-white md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link
            to={routePaths.root}
            className="group flex min-h-[44px] w-fit shrink-0 items-center gap-2 rounded-xl hover:-translate-y-0.5"
            aria-label="BookNest Homepage"
          >
            <img
              src={Logo}
              alt="BookNest logo"
              className="h-10 w-10 transition-transform duration-200 ease-out group-hover:scale-105 sm:h-12 sm:w-12"
            />
            <span className="text-lg sm:text-2xl text-accent-v bg-clip-text text-transparent font-semibold">
              BookNest
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-primary-gray">
            A warmer place to discover, track, and remember the books that stay
            with you.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase text-primary-white">Navigation</h2>
          <div className="flex flex-col gap-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex min-h-[44px] w-fit items-center rounded-full px-3 py-2 text-primary-gray hover:bg-primary-black hover:text-primary-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase text-primary-white">Social</h2>
          <div className="flex gap-2">
            {socialLinks.map((label) => (
              <button
                key={label}
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary-black text-primary-gray hover:text-accent"
                aria-label={label}
              >
                <span aria-hidden="true" className="text-sm font-bold">
                  {label.slice(0, 1)}
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm text-primary-gray">
            BookNest © 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
