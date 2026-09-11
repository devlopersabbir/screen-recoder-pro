import React from "react";
import { SettingsTab, TabItem } from "../types";

interface TabNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const TABS: TabItem[] = [
  { id: "video", label: "Video & Format", icon: "🎥" },
  { id: "audio", label: "Audio & Devices", icon: "🎙️" },
  { id: "output", label: "Export & Save", icon: "📁" },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        background: "rgba(18, 24, 38, 0.6)",
        padding: "4px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
      role="tablist"
    >
      {TABS.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: isSelected ? 600 : 500,
              cursor: "pointer",
              background: isSelected ? "rgba(255, 255, 255, 0.12)" : "transparent",
              color: isSelected ? "#ffffff" : "#94a3b8",
              boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.25)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
