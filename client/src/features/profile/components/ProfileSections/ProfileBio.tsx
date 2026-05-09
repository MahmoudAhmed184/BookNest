import type { ReactElement } from "react";

import type { UserProfile } from "../../types/user";
import {
  normalizeExternalUrl,
  primaryInterests,
  socialLinkLabel,
} from "../../utils/profileDisplay";

export interface ProfileBioProps {
  bio?: string | null | undefined;
  user?: UserProfile | undefined;
}

interface BioIconProps {
  name: "globe" | "link" | "pin" | "tag";
}

function BioIcon({ name }: BioIconProps): ReactElement {
  const commonProps = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "globe") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...commonProps}>
        <path d="M12 22s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "tag") {
    return (
      <svg {...commonProps}>
        <path d="M20.6 13.5 13.5 20.6a2 2 0 0 1-2.8 0L3 12.9V3h9.9l7.7 7.7a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
    </svg>
  );
}

export function ProfileBio({ bio, user }: ProfileBioProps): ReactElement {
  const resolvedBio = user?.bio ?? bio;
  const interests = primaryInterests(user?.interest_links);
  const websiteUrl = normalizeExternalUrl(user?.website_url);
  const socialLinks = user?.social_links ?? [];
  const hasMeta = Boolean(user?.location || websiteUrl || socialLinks.length || interests.length);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]" aria-labelledby="bio-title">
      <article className="min-w-0 rounded-lg border border-[var(--surface-glass-border)] bg-[var(--surface-panel)] p-5 shadow-md">
        <p className="text-xs font-bold uppercase text-accent">About</p>
        <h2 id="bio-title" className="mt-1 text-2xl font-bold text-primary-white">
          Reader profile
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-primary-white">
          {resolvedBio || "No bio added yet."}
        </p>
      </article>
      <aside className="rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/25 p-5 shadow-md" aria-label="Profile details">
        <p className="text-xs font-bold uppercase text-accent">Details</p>
        {hasMeta ? (
          <div className="mt-4 flex flex-col gap-3">
            {user?.location ? (
              <p className="flex min-w-0 items-center gap-2 text-sm text-primary-gray">
                <span className="text-accent"><BioIcon name="pin" /></span>
                <span className="truncate">{user.location}</span>
              </p>
            ) : null}
            {websiteUrl ? (
              <a
                href={websiteUrl}
                className="flex min-h-[36px] min-w-0 items-center gap-2 rounded-lg text-sm font-semibold text-primary-white hover:text-accent"
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-accent"><BioIcon name="globe" /></span>
                <span className="truncate">{user?.website_url}</span>
              </a>
            ) : null}
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={normalizeExternalUrl(link.url) ?? link.url}
                className="flex min-h-[36px] min-w-0 items-center gap-2 rounded-lg text-sm font-semibold text-primary-white hover:text-accent"
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-accent"><BioIcon name="link" /></span>
                <span className="truncate">{socialLinkLabel(link)}</span>
              </a>
            ))}
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {interests.map((interest) => (
                  <span
                    key={interest.id}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[var(--surface-glass-border)] bg-primary-black/35 px-3 py-1 text-xs font-semibold text-primary-gray"
                  >
                    <BioIcon name="tag" />
                    {interest.genre_name ?? `Genre ${interest.genre}`}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-primary-gray">
            Location, links, and favorite genres will appear here.
          </p>
        )}
      </aside>
    </section>
  );
}
