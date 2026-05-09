import type { SettingsTabItem } from "../components/SettingsSections";

export const settingsTabs: SettingsTabItem[] = [
  { id: "account", label: "Account", description: "Identity and email" },
  { id: "profile", label: "Profile", description: "Public reader details" },
  { id: "preferences", label: "Preferences", description: "Privacy and discovery" },
  { id: "security", label: "Security", description: "Password access" },
];
