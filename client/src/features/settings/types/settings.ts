import type { Profile } from "../../profile/types/user";

export interface SettingsSocialLinkDraft {
  key: string;
  id?: number;
  platform: string;
  url: string;
  label: string;
}

export type SettingsProfileType = NonNullable<Profile["profile_type"]>;
