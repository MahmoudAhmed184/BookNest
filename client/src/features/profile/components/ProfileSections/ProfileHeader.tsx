import type { ReactElement } from "react";

import type { UserProfile } from "../../types/user";
import {
  getFallbackHueStyle,
  getInitials,
  resolveProfileImage,
} from "../../utils/profileDisplay";

export interface ProfileHeaderProps {
  user: UserProfile;
  action: ReactElement;
  center?: boolean | undefined;
}

export function ProfileHeader({
  user,
  action,
  center = false,
}: ProfileHeaderProps): ReactElement {
  const profileImage = resolveProfileImage(user.picture || user.picture_fallback_url);
  const displayName = user.user.display_name || user.handle;

  return (
    <section className={`flex flex-col gap-5 sm:flex-row sm:items-center ${center ? "items-center" : "items-start"}`}>
      <div className="h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-secondary-black shadow-xl sm:h-40 sm:w-40 md:h-44 md:w-44">
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${displayName}'s profile image`}
            className="h-full w-full object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
            width="176"
            height="176"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="fallback-gradient flex h-full w-full items-center justify-center text-5xl font-bold text-primary-white"
            style={getFallbackHueStyle(displayName)}
          >
            {getInitials(displayName)}
          </div>
        )}
      </div>
      <div className={`flex min-w-0 flex-col gap-3 ${center ? "items-center sm:items-start" : "items-start"}`}>
        <h1 className="display-heading break-words text-3xl sm:text-4xl md:text-5xl">{displayName}</h1>
        {action}
      </div>
    </section>
  );
}
