import React from "react";
import { Link } from "react-router-dom";
import Logo from "/logo.svg";

export default function Footer() {
  return (
    <footer>
      <div className="bg-secondary-black text-primary-white py-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="BookNest Homepage"
          >
            <img
              src={Logo}
              alt="BookNest Logo"
              className="w-10 sm:w-12 h-10 sm:h-12"
            />
            <h2 className="text-lg sm:text-2xl text-accent-v bg-clip-text text-transparent font-semibold">
              BookNest
            </h2>
          </Link>
        </div>
      </div>
      <div className="bg-primary-black text-primary-white py-4 sm:py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <p className="text-center text-sm sm:text-base">
            All copyrights are reserved for BookNest © 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
