import React from "react";
import { RecorderSettings } from "../../utils/settings";
import { Switch } from "./Switch";

interface MicSectionProps {
  settings: RecorderSettings;
  audioInputs: MediaDeviceInfo[];
  isTestingMic: boolean;
  micLevel: number;
  onUpdate: (updates: Partial<RecorderSettings>) => void;
  onStartMicTest: () => void;
  onStopMicTest: () => void;
}

export const MicSection: React.FC<MicSectionProps> = ({
  settings,
  audioInputs,
  isTestingMic,
  micLevel,
  onUpdate,
  onStartMicTest,
  onStopMicTest,
}) => {
  return (
    <>
      {/* Microphone Toggle Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>
            Microphone
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Record your voice narration alongside screen
          </div>
        </div>

        <Switch
          checked={settings.micAudio}
          onChange={() => onUpdate({ micAudio: !settings.micAudio })}
          ariaLabel="Microphone Audio Toggle"
        />
      </div>

      {/* Physical Microphone Selection & Live Test Row */}
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
              Microphone Input
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Select specific physical mic hardware
            </div>
          </div>

          <select
            value={settings.micDeviceId}
            onChange={(e) => onUpdate({ micDeviceId: e.target.value })}
            aria-label="Microphone Input Device"
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
            <option value="default">Default Microphone</option>
            {audioInputs.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Live Audio Level Meter & Test Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <button
            type="button"
            onClick={isTestingMic ? onStopMicTest : onStartMicTest}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: `1px solid ${isTestingMic ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.12)"}`,
              background: isTestingMic ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
              color: isTestingMic ? "#f87171" : "#cbd5e1",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isTestingMic ? "■ Stop Test" : "▶ Test Mic"}
          </button>

          {/* Level Meter Bar */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                flex: 1,
                height: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${micLevel}%`,
                  height: "100%",
                  background: micLevel > 70 ? "#ef4444" : micLevel > 30 ? "#eab308" : "#10b981",
                  borderRadius: "3px",
                  transition: "width 0.08s ease",
                }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", minWidth: "32px", textAlign: "right" }}>
              {isTestingMic ? `${micLevel}%` : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
