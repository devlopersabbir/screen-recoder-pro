import React from "react";
import { createRoot } from "react-dom/client";
import { FloatingWidget } from "./FloatingWidget";
import styles from "./floating-widget.css?inline";

const ROOT_ID = "screen-recorder-pro-floating-widget";

export function initFloatingWidget(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  // Prevent duplicate injections
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    return existing;
  }

  // Create host container
  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "auto";

  // Attach isolated Shadow DOM
  const shadowRoot = host.attachShadow({ mode: "open" });

  // Encapsulate CSS inside Shadow Root
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadowRoot.appendChild(styleEl);

  // Mount point for React
  const mountPoint = document.createElement("div");
  mountPoint.className = "srp-mount-root";
  shadowRoot.appendChild(mountPoint);

  // Ensure DOM is ready before appending
  const target = document.body || document.documentElement;
  if (target) {
    target.appendChild(host);
  }

  // Render React Tree
  const root = createRoot(mountPoint);
  root.render(<FloatingWidget />);

  console.info("[Screen Recorder Pro] In-page floating controls widget loaded.");
  return host;
}

// Automatically initialize when script is injected
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initFloatingWidget());
  } else {
    initFloatingWidget();
  }
}
