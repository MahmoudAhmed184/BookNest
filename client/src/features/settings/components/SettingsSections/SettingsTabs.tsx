import type { ReactElement } from "react";

export type SettingsTab = "account" | "profile" | "preferences" | "security";

export interface SettingsTabItem {
  id: SettingsTab;
  label: string;
  description: string;
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
    <nav
      className="settings-panel overflow-hidden p-2 lg:flex lg:flex-col lg:gap-1"
      aria-label="Settings sections"
    >
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={`#settings-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex min-h-[44px] min-w-max flex-col justify-center rounded-lg px-3 py-2 text-left text-sm font-semibold lg:min-w-0 lg:px-4 lg:py-3 ${
                isActive
                  ? "bg-accent text-accent-contrast shadow-md"
                  : "text-primary-gray hover:bg-primary-black/70 hover:text-primary-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.label}</span>
              <span
                className={`hidden text-xs font-medium leading-relaxed lg:block ${
                  isActive ? "text-accent-contrast/80" : "text-primary-gray"
                }`}
              >
                {tab.description}
              </span>
            </a>
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
