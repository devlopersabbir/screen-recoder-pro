import React from "react";
import { RecorderSettings } from "../../utils/settings";
import { VideoFormat, VideoQuality } from "../../recorder/types";

interface VideoTabProps {
  settings: RecorderSettings;
  mp4Supported: boolean;
  onUpdate: (updates: Partial<RecorderSettings>) => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  settings,
  mp4Supported,
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
      {/* Format Row */}
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
            Format
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            {settings.format === "mp4" && mp4Supported
              ? "MP4 (H.264 / AVC) • Universal playback"
              : "WebM (VP9 / Opus) • Open web standard"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.35)",
            padding: "3px",
            borderRadius: "9px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {(["mp4", "webm"] as VideoFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => onUpdate({ format: fmt })}
              style={{
                padding: "5px 14px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                cursor: "pointer",
                background:
                  settings.format === fmt ? "rgba(255, 255, 255, 0.14)" : "transparent",
                color: settings.format === fmt ? "#ffffff" : "#94a3b8",
                boxShadow:
                  settings.format === fmt ? "0 2px 6px rgba(0, 0, 0, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Preset Row */}
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
            Quality
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            {settings.quality === "ultra"
              ? "4K UHD • 24 Mbps bitrate (Maximum clarity)"
              : settings.quality === "high"
              ? "1080p Full HD • 12 Mbps bitrate (Recommended)"
              : "720p HD • 6 Mbps bitrate (Compact size)"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.35)",
            padding: "3px",
            borderRadius: "9px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {[
            { id: "standard", label: "720p" },
            { id: "high", label: "1080p" },
            { id: "ultra", label: "4K" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onUpdate({ quality: item.id as VideoQuality })}
              style={{
                padding: "5px 12px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  settings.quality === item.id ? "rgba(255, 255, 255, 0.14)" : "transparent",
                color: settings.quality === item.id ? "#ffffff" : "#94a3b8",
                boxShadow:
                  settings.quality === item.id ? "0 2px 6px rgba(0, 0, 0, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate Row */}
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
            Frame Rate
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            {settings.frameRate === 60 ? "Fluid 60 FPS motion" : "Standard 30 FPS"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.35)",
            padding: "3px",
            borderRadius: "9px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          {[60, 30].map((fps) => (
            <button
              key={fps}
              type="button"
              onClick={() => onUpdate({ frameRate: fps as 60 | 30 })}
              style={{
                padding: "5px 14px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  settings.frameRate === fps ? "rgba(255, 255, 255, 0.14)" : "transparent",
                color: settings.frameRate === fps ? "#ffffff" : "#94a3b8",
                boxShadow:
                  settings.frameRate === fps ? "0 2px 6px rgba(0, 0, 0, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
