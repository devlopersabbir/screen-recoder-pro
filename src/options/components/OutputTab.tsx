import React from "react";
import { RecorderSettings } from "../../utils/settings";
import { Switch } from "./Switch";

interface OutputTabProps {
  settings: RecorderSettings;
  onUpdate: (updates: Partial<RecorderSettings>) => void;
}

const SUBFOLDER_PRESETS = ["ScreenRecordings", "Videos", "Captures", ""];

export const OutputTab: React.FC<OutputTabProps> = ({
  settings,
  onUpdate,
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
      {/* Filename Prefix Row */}
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
            Filename Prefix
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Prefix prepended before the timestamp
          </div>
        </div>

        <input
          type="text"
          value={settings.filenamePrefix}
          onChange={(e) => onUpdate({ filenamePrefix: e.target.value })}
          placeholder="screen-recording"
          style={{
            width: "160px",
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            padding: "6px 10px",
            color: "#f8fafc",
            fontSize: "12px",
            fontFamily: "inherit",
            outline: "none",
            textAlign: "right",
          }}
        />
      </div>

      {/* Pre-Location Setup Row */}
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
            marginBottom: "8px",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9" }}>
              Save Location (Subfolder)
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Pre-set folder inside your Downloads directory
            </div>
          </div>

          <input
            type="text"
            value={settings.downloadSubfolder}
            onChange={(e) => onUpdate({ downloadSubfolder: e.target.value })}
            placeholder="ScreenRecordings"
            aria-label="Download Subfolder Location"
            style={{
              width: "160px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "6px 10px",
              color: "#f8fafc",
              fontSize: "12px",
              fontFamily: "inherit",
              outline: "none",
              textAlign: "right",
            }}
          />
        </div>

        {/* Subfolder presets & dynamic path preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            {SUBFOLDER_PRESETS.map((preset) => (
              <button
                key={preset || "root"}
                type="button"
                onClick={() => onUpdate({ downloadSubfolder: preset })}
                style={{
                  padding: "3px 8px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background:
                    settings.downloadSubfolder === preset
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(255, 255, 255, 0.04)",
                  color:
                    settings.downloadSubfolder === preset ? "#fca5a5" : "#94a3b8",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {preset || "Downloads (Root)"}
              </button>
            ))}
          </div>

          <span
            style={{
              fontSize: "11px",
              color: settings.downloadLocationPrompt ? "#fbbf24" : "#10b981",
              fontWeight: 500,
            }}
          >
            {settings.downloadLocationPrompt
              ? "File picker prompts on save"
              : `Direct save: Downloads/${settings.downloadSubfolder ? settings.downloadSubfolder + "/" : ""}`}
          </span>
        </div>
      </div>

      {/* Ask Save Location Row */}
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
            Ask Save Location
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Prompt folder location for each recording instead of auto-saving directly
          </div>
        </div>

        <Switch
          checked={settings.downloadLocationPrompt}
          onChange={() =>
            onUpdate({
              downloadLocationPrompt: !settings.downloadLocationPrompt,
            })
          }
          ariaLabel="Ask Save Location Toggle"
        />
      </div>
    </div>
  );
};
