import React from "react";
import { BUY_ME_A_COFFEE_URL } from "../../shared/constants";

export const SupportCard: React.FC = () => {
  return (
    <div
      style={{
        background: "rgba(18, 24, 38, 0.7)",
        border: "1px solid rgba(255, 221, 0, 0.2)",
        borderRadius: "16px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(255, 221, 0, 0.12)",
            border: "1px solid rgba(255, 221, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          ☕
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>
            Support the Developer
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            Screen Recorder Pro is free & open source. Consider buying me a coffee to support development!
          </div>
        </div>
      </div>

      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          background: "#FFDD00",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "12px",
          padding: "9px 16px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(255, 221, 0, 0.25)",
          transition: "all 0.15s ease",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 221, 0, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(255, 221, 0, 0.25)";
        }}
      >
        <span>☕</span>
        <span>Buy me a coffee</span>
      </a>
    </div>
  );
};
