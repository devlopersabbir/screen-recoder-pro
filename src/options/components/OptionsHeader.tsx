import React from "react";
import { BUY_ME_A_COFFEE_URL } from "../../shared/constants";

interface OptionsHeaderProps {
  savedToast: boolean;
}

export const OptionsHeader: React.FC<OptionsHeaderProps> = ({ savedToast }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src="/v1.png"
          alt="Screen Recorder Pro"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            objectFit: "cover",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
          }}
        />
        <div>
          <h1
            style={{
              fontSize: "17px",
              fontWeight: 600,
              letterSpacing: "-0.3px",
              margin: 0,
              color: "#f8fafc",
            }}
          >
            Screen Recorder Pro
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Settings & Audio Routing
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Buy me a coffee (@devlopersabbir)"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "12px",
            color: "#111827",
            background: "#FFDD00",
            border: "1px solid rgba(255, 221, 0, 0.4)",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(255, 221, 0, 0.25)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 3px 10px rgba(255, 221, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 221, 0, 0.25)";
          }}
        >
          <span>☕</span>
          <span>Buy me a coffee</span>
        </a>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "12px",
            color: savedToast ? "#34d399" : "#64748b",
            background: savedToast ? "rgba(16, 185, 129, 0.14)" : "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${savedToast ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
            transition: "all 0.2s ease",
          }}
        >
          {savedToast ? "Saved ✓" : "Preferences"}
        </div>
      </div>
    </div>
  );
};
