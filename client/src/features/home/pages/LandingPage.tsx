import type { ReactElement } from "react";
import Logo from "/logo.svg";

import { Link } from "react-router-dom";
import { routePaths } from "../../../routes/paths";

export default function Landing(): ReactElement {
  return (
    <section
      className="grow flex flex-col items-center justify-center gap-6 py-16 text-center relative animate-fade-up"
      aria-labelledby="landing-title"
    >
      <div className="blob" aria-hidden="true"></div>
      <img
        src={Logo}
        alt="BookNest logo"
        className="w-24 sm:w-32 md:w-32 relative z-10 transition-transform duration-200 ease-out hover:scale-105"
        width="128"
        height="128"
      />
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-4">
        <h1
          id="landing-title"
          className="text-3xl sm:text-4xl md:text-5xl text-accent-v bg-clip-text text-transparent font-semibold text-balance"
        >
          Discover Your Next Favorite Book
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-primary-gray max-w-2xl leading-relaxed">
          Dive into a world of stories tailored just for you. Connect with fellow
          book lovers, track your reading journey, and uncover hidden gems from
          every genre.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 relative z-10">
        <Link
          to={routePaths.login}
          className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
        >
          Get Started
        </Link>
        <Link
          to={routePaths.explore}
          className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3 sm:text-base"
        >
          Explore Now
        </Link>
      </div>
    </section>
  );
}
