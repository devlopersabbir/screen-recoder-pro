import React from "react";
import { RecorderSettings } from "../../utils/settings";
import { Switch } from "./Switch";
import { MicSection } from "./MicSection";
import { AudioOutputSection } from "./AudioOutputSection";

interface AudioTabProps {
  settings: RecorderSettings;
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  hasUnlabeledDevices: boolean;
  isTestingMic: boolean;
  micLevel: number;
  isPlayingTestTone: boolean;
  onUpdate: (updates: Partial<RecorderSettings>) => void;
  onStartMicTest: () => void;
  onStopMicTest: () => void;
  onPlayTestTone: () => void;
  onRequestDevicePermission: () => void;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  settings,
  audioInputs,
  audioOutputs,
  hasUnlabeledDevices,
  isTestingMic,
  micLevel,
  isPlayingTestTone,
  onUpdate,
  onStartMicTest,
  onStopMicTest,
  onPlayTestTone,
  onRequestDevicePermission,
}) => {
  return (
    <div
      style={{
        background: "rgba(18, 24, 38, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Microphone Section */}
      <MicSection
        settings={settings}
        audioInputs={audioInputs}
        isTestingMic={isTestingMic}
        micLevel={micLevel}
        onUpdate={onUpdate}
        onStartMicTest={onStartMicTest}
        onStopMicTest={onStopMicTest}
      />

      {/* System Audio Toggle Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>
            System Audio
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Capture internal tab, app, and meeting sounds
          </div>
        </div>

        <Switch
          checked={settings.systemAudio}
          onChange={() => onUpdate({ systemAudio: !settings.systemAudio })}
          ariaLabel="System Audio Toggle"
        />
      </div>

      {/* Audio Output Section */}
      <AudioOutputSection
        settings={settings}
        audioOutputs={audioOutputs}
        hasUnlabeledDevices={hasUnlabeledDevices}
        isPlayingTestTone={isPlayingTestTone}
        onUpdate={onUpdate}
        onPlayTestTone={onPlayTestTone}
        onRequestDevicePermission={onRequestDevicePermission}
      />
    </div>
  );
};
