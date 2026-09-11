import React from "react";
import { APP_VERSION, GITHUB_REPO_URL } from "../../shared/constants";

export const OptionsFooter: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px",
        fontSize: "11px",
        color: "#475569",
      }}
    >
      <span>Offline & Local-First • Zero Cloud Uploads</span>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#64748b", textDecoration: "none" }}
        >
          GitHub
        </a>
        <span>v{APP_VERSION}</span>
      </div>
    </div>
  );
};
