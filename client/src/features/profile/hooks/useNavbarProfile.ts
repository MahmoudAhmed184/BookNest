import { useQuery } from "@tanstack/react-query";

import { getMyProfile } from "../services/userService";
import type { UserProfile } from "../types/user";
import { profileKeys } from "./profile.keys";

interface UseNavbarProfileResult {
  profile?: UserProfile | null | undefined;
}

export function useNavbarProfile(
  enabled: boolean,
  token?: string | null
): UseNavbarProfileResult {
  const profileQuery = useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getMyProfile(token),
    enabled,
  });

  return { profile: profileQuery.data };
}
