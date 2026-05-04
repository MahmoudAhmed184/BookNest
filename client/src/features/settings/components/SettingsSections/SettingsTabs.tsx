import type { ReactElement } from "react";

export type SettingsTab = "account" | "profile" | "security";

export interface SettingsTabItem {
  id: SettingsTab;
  label: string;
}

export interface SettingsTabsProps {
  tabs: SettingsTabItem[];
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onLogout: () => void;
}

export function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
  onLogout,
}: SettingsTabsProps): ReactElement {
  return (
    <div className="glass-card flex flex-col gap-2 p-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium ${
            activeTab === tab.id
              ? "btn-accent-v text-primary-white shadow-md"
              : "text-primary-gray hover:bg-primary-black hover:text-primary-white"
          }`}
          aria-pressed={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="min-h-[44px] rounded-lg px-4 py-2 text-left text-sm font-medium text-primary-gray hover:bg-primary-black hover:text-primary-white"
      >
        Logout
      </button>
    </div>
  );
}
