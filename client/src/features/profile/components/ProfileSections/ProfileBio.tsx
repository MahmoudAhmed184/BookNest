import type { ReactElement } from "react";

export interface ProfileBioProps {
  bio?: string | null | undefined;
}

export function ProfileBio({ bio }: ProfileBioProps): ReactElement {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="bio-title">
      <h2 id="bio-title" className="text-xl font-bold text-primary-white">Bio</h2>
      <p className="glass-card max-w-3xl p-5 text-base leading-relaxed text-primary-white">
        {bio || "No bio added yet."}
      </p>
    </section>
  );
}
