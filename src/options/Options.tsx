import React, { useEffect, useState } from "react";
import {
  checkFormatSupport,
  DEFAULT_SETTINGS,
  getSettings,
  RecorderSettings,
  saveSettings,
} from "../utils/settings";
import { SettingsTab } from "./types";
import { useOptionsDevices } from "./useOptionsDevices";
import { OptionsHeader } from "./components/OptionsHeader";
import { TabNavigation } from "./components/TabNavigation";
import { VideoTab } from "./components/VideoTab";
import { AudioTab } from "./components/AudioTab";
import { OutputTab } from "./components/OutputTab";
import { SupportCard } from "./components/SupportCard";
import { OptionsFooter } from "./components/OptionsFooter";

export const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("video");
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const [savedToast, setSavedToast] = useState(false);
  const [mp4Supported, setMp4Supported] = useState(true);

  const {
    audioInputs,
    audioOutputs,
    hasUnlabeledDevices,
    isTestingMic,
    micLevel,
    isPlayingTestTone,
    requestDevicePermission,
    startMicTest,
    stopMicTest,
    playTestTone,
  } = useOptionsDevices(settings);

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
    });
    setMp4Supported(checkFormatSupport("mp4"));
  }, []);

  const handleUpdate = async (updates: Partial<RecorderSettings>) => {
    const updated = await saveSettings(updates);
    setSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#080b12",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.08) 0px, transparent 50%)",
        color: "#f1f5f9",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "40px 16px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Header */}
        <OptionsHeader savedToast={savedToast} />

        {/* Navigation Tabs */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab 1: Video Settings Card */}
        {activeTab === "video" && (
          <VideoTab
            settings={settings}
            mp4Supported={mp4Supported}
            onUpdate={handleUpdate}
          />
        )}

        {/* Tab 2: Audio & Physical Devices Card */}
        {activeTab === "audio" && (
          <AudioTab
            settings={settings}
            audioInputs={audioInputs}
            audioOutputs={audioOutputs}
            hasUnlabeledDevices={hasUnlabeledDevices}
            isTestingMic={isTestingMic}
            micLevel={micLevel}
            isPlayingTestTone={isPlayingTestTone}
            onUpdate={handleUpdate}
            onStartMicTest={startMicTest}
            onStopMicTest={stopMicTest}
            onPlayTestTone={playTestTone}
            onRequestDevicePermission={requestDevicePermission}
          />
        )}

        {/* Tab 3: Export & Storage Card */}
        {activeTab === "output" && (
          <OutputTab settings={settings} onUpdate={handleUpdate} />
        )}

        {/* Support & Buy Me a Coffee Card */}
        <SupportCard />

        {/* Footer info */}
        <OptionsFooter />
      </div>
    </div>
  );
};
