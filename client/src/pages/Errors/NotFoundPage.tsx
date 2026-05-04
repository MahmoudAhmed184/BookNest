import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { routePaths } from "../../routes";

export default function NotFound(): ReactElement {
  return (
    <div className="grow flex flex-col items-center justify-center gap-8 py-16 text-center relative animate-fade-up">
      <div className="blob" aria-hidden="true"></div>
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6">
        <svg
          className="h-32 w-32 text-accent"
          viewBox="0 0 160 160"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M34 32h62a18 18 0 0 1 18 18v78H46a12 12 0 0 1-12-12V32Z"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M46 128a12 12 0 0 1 0-24h68"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M58 54h34M58 72h24"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M105 42 128 24M124 42l-19-18"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase text-primary-gray">
            Error 404
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-accent-v bg-clip-text text-transparent font-semibold text-balance">
            Page not found
          </h1>
          <p className="text-base sm:text-lg text-primary-white max-w-xl leading-relaxed">
            This page is not on the shelf anymore. Head home or browse books to
            keep reading.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={routePaths.root}
            className="btn btn-accent-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3"
          >
            Go home
          </Link>
          <Link
            to={routePaths.explore}
            className="btn btn-primary-v inline-flex min-h-[44px] items-center justify-center px-5 py-2 text-sm font-medium text-primary-white shadow-md hover:-translate-y-0.5 hover:shadow-lg sm:px-6 sm:py-3"
          >
            Browse books
          </Link>
        </div>
      </div>
    </div>
  );
}
