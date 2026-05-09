import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { routePaths } from "../../../../routes/paths";
import Logo from "/logo.svg";

const shelfSpines = [
  { id: "accent", className: "h-28 w-8 bg-accent" },
  { id: "info", className: "h-40 w-9 bg-info" },
  { id: "muted", className: "h-32 w-7 bg-surface-muted" },
  { id: "success", className: "h-44 w-10 bg-success" },
  { id: "warning", className: "h-36 w-8 bg-warning" },
  { id: "surface", className: "h-24 w-7 bg-surface-elevated" },
] as const;

const previewStats = [
  {
    label: "Collections",
    value: "3",
    className: "border-info/25 bg-info/15 text-info",
  },
  {
    label: "Ratings",
    value: "12",
    className: "border-warning/25 bg-warning/15 text-warning",
  },
  {
    label: "Recs",
    value: "Fresh",
    className: "border-success/25 bg-success/15 text-success",
  },
] as const;

export function RegisterShelfPreview(): ReactElement {
  return (
    <aside
      className="hidden lg:flex lg:items-center"
      aria-label="BookNest onboarding preview"
    >
      <div className="w-full max-w-xl">
        <Link
          to={routePaths.root}
          className="mb-8 inline-flex items-center gap-3 rounded-lg px-2 py-2 text-primary-white hover:text-accent"
          aria-label="BookNest home"
        >
          <img
            className="h-11 w-11"
            src={Logo}
            alt=""
            width="44"
            height="44"
          />
          <span className="text-lg font-bold">BookNest</span>
        </Link>
        <h2 className="max-w-xl text-4xl font-bold leading-tight text-primary-white text-balance">
          Build a shelf that gets smarter as you read.
        </h2>
        <p className="mt-4 max-w-lg text-base leading-7 text-primary-gray">
          Save books, shape collections, and let recommendations improve from
          the signals you choose to share.
        </p>

        <div className="mt-8 rounded-lg border border-[var(--surface-glass-border)] bg-secondary-black/70 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary-gray">Starter shelf</p>
              <p className="font-semibold text-primary-white">
                Your first reading space
              </p>
            </div>
            <span className="rounded-full border border-success/25 bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              Ready
            </span>
          </div>

          <div
            className="mt-6 flex h-48 items-end gap-2 border-b border-secondary-gray/50 pb-3"
            aria-hidden="true"
          >
            {shelfSpines.map((spine) => (
              <span
                key={spine.id}
                className={`${spine.className} rounded-sm shadow-sm`}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {previewStats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg border p-3 ${stat.className}`}
              >
                <p className="text-lg font-bold leading-none">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-primary-gray">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
