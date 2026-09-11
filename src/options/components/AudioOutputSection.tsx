import React from "react";
import { RecorderSettings } from "../../utils/settings";

interface AudioOutputSectionProps {
  settings: RecorderSettings;
  audioOutputs: MediaDeviceInfo[];
  hasUnlabeledDevices: boolean;
  isPlayingTestTone: boolean;
  onUpdate: (updates: Partial<RecorderSettings>) => void;
  onPlayTestTone: () => void;
  onRequestDevicePermission: () => void;
}

export const AudioOutputSection: React.FC<AudioOutputSectionProps> = ({
  settings,
  audioOutputs,
  hasUnlabeledDevices,
  isPlayingTestTone,
  onUpdate,
  onPlayTestTone,
  onRequestDevicePermission,
}) => {
  return (
    <>
      {/* Audio Output Selection & Sound Test Row */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>
              Audio Output
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Preferred speaker or headphone device
            </div>
          </div>

          <select
            value={settings.audioOutputDeviceId}
            onChange={(e) => onUpdate({ audioOutputDeviceId: e.target.value })}
            aria-label="Audio Output Device"
            style={{
              maxWidth: "220px",
              width: "100%",
              background: "rgba(0, 0, 0, 0.45)",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "12px",
              fontFamily: "inherit",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="default">Default Output</option>
            {audioOutputs.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Speaker/Headphone ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Sound Test Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Verify playback through selected speaker
          </span>
          <button
            type="button"
            onClick={onPlayTestTone}
            disabled={isPlayingTestTone}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: isPlayingTestTone
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(255, 255, 255, 0.05)",
              color: isPlayingTestTone ? "#34d399" : "#cbd5e1",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{isPlayingTestTone ? "🔊 Playing..." : "🔔 Play Test Chime"}</span>
          </button>
        </div>
      </div>

      {hasUnlabeledDevices && (
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(239, 68, 68, 0.05)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#f87171" }}>
            Hardware names require one-time browser permission
          </span>
          <button
            type="button"
            onClick={onRequestDevicePermission}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Allow Device Names
          </button>
        </div>
      )}
    </>
  );
};
