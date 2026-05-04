import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import Logo from "/logo.svg";

export interface FooterProps {}

export default function Footer({}: FooterProps): ReactElement {
  return (
    <footer className="mt-12">
      <div className="bg-secondary-black text-primary-white py-5">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            to="/"
            className="group flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5"
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
          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-2 text-sm">
            <Link
              to="/explore"
              className="rounded-full px-3 py-2 text-primary-gray hover:bg-primary-black hover:text-primary-white"
            >
              Explore
            </Link>
            <Link
              to="/categories"
              className="rounded-full px-3 py-2 text-primary-gray hover:bg-primary-black hover:text-primary-white"
            >
              Categories
            </Link>
            <Link
              to="/search"
              className="rounded-full px-3 py-2 text-primary-gray hover:bg-primary-black hover:text-primary-white"
            >
              Search
            </Link>
          </nav>
        </div>
      </div>
      <div className="bg-primary-black text-primary-white py-4 sm:py-5">
        <div className="container mx-auto flex items-center justify-center">
          <p className="text-center text-sm text-primary-gray sm:text-base">
            All copyrights are reserved for BookNest © 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
