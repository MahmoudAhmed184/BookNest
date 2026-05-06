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
    <nav className="settings-panel p-1.5 lg:flex lg:flex-col lg:gap-1 lg:p-2" aria-label="Settings sections">
      <div className="grid grid-cols-3 gap-1 lg:flex lg:flex-col">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-center text-sm font-semibold lg:px-4 lg:py-2.5 lg:text-left ${
                isActive
                  ? "bg-accent text-primary-black shadow-md"
                  : "text-primary-gray hover:bg-primary-black/70 hover:text-primary-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 hidden min-h-[44px] rounded-lg border-t border-[var(--surface-glass-border)] px-4 py-2.5 text-left text-sm font-semibold text-primary-gray hover:bg-primary-black/70 hover:text-primary-white lg:block"
      >
        Log out
      </button>
    </nav>
  );
}
