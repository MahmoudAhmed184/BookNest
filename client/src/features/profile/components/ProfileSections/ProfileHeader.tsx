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
  const profileImage = resolveProfileImage(user.profile_pic);

  return (
    <section className={`flex flex-col gap-6 md:flex-row md:items-end ${center ? "items-center" : ""}`}>
      <div className="h-64 w-64 overflow-hidden rounded-xl bg-secondary-black shadow-xl">
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${user.username}'s profile image`}
            className="h-full w-full object-cover transition-transform duration-200 ease-out hover:scale-[1.03]"
            width="256"
            height="256"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="fallback-gradient flex h-full w-full items-center justify-center text-5xl font-bold text-primary-white"
            style={getFallbackHueStyle(user.username)}
          >
            {getInitials(user.username)}
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-4 ${center ? "items-center md:items-start" : ""}`}>
        <h1 className="display-heading text-4xl md:text-5xl">{user.username}</h1>
        {action}
      </div>
    </section>
  );
}
