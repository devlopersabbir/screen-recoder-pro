export type SettingsTab = "video" | "audio" | "output";

export interface TabItem {
  id: SettingsTab;
  label: string;
  icon: string;
}
