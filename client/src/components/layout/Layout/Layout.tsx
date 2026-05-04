import type { ReactElement } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ErrorBoundary } from "../ErrorBoundary";
import { Footer } from "../Footer";
import { Navbar } from "../Navbar";
import { useSearchShortcut } from "../../../hooks/useSearchShortcut";

const toastPosition =
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 768px)").matches
    ? "top-right"
    : "top-center";

const successIcon = (
  <svg
    className="h-5 w-5 text-accent"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
      clipRule="evenodd"
    />
  </svg>
);

const errorIcon = (
  <svg
    className="h-5 w-5 text-accent"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.2 10l-3.3 3.3a1 1 0 1 0 1.4 1.4L9.6 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11 10l3.3-3.3a1 1 0 0 0-1.4-1.4L9.6 8.6 6.3 5.3Z"
      clipRule="evenodd"
    />
  </svg>
);

export function Layout(): ReactElement {
  useSearchShortcut();

  return (
    <div className="flex min-h-screen flex-col bg-primary-black text-primary-white">
      <Toaster
        position={toastPosition}
        toastOptions={{
          duration: 3000,
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
          className: "booknest-toast",
          success: {
            duration: 3000,
            icon: successIcon,
          },
          error: {
            duration: 5000,
            icon: errorIcon,
          },
        }}
      />
      <Navbar />
      <main className="container z-0 flex grow flex-col">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
