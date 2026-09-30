import React, { useState, useEffect, useRef, useCallback } from "react";
import Browser from "webextension-polyfill";
import { useRecorder } from "../hooks/useRecorder";
import { RecordingResult, RecordingState } from "../recorder/types";
import {
  ExtensionMessage,
  StateUpdateMessage,
} from "../shared/messages";
import { DEFAULT_SETTINGS, getSettings, saveSettings, QUALITY_PRESETS, RecorderSettings } from "../utils/settings";
import { downloadBlob } from "../utils/download";

export interface FloatingWidgetProps {
  initialState?: RecordingState;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  confirmHandler?: (msg: string) => boolean;
}

export function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  initialState,
  onStart,
  onStop,
  onPause,
  onResume,
  onCancel,
  confirmHandler,
}) => {
  const {
    state: hookState,
    result,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    downloadRecording,
    resetRecording,
  } = useRecorder();

  // Support manual prop override for unit tests or background-synchronized state
  const [testState, setTestState] = useState<RecordingState | null>(initialState ?? null);
  const [bgResult, setBgResult] = useState<RecordingResult | null>(null);
  const activeResult = result || bgResult;

  // Active state transitions to COMPLETED when either local recorder or background completes
  const activeState: RecordingState =
    hookState === "COMPLETED" || testState === "COMPLETED"
      ? "COMPLETED"
      : (testState ?? hookState);

  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(!DEFAULT_SETTINGS.micAudio);
  const [seconds, setSeconds] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return {
      x: 32,
      y: typeof window !== "undefined" ? Math.max(20, window.innerHeight - 80) : 600,
    };
  });

  // Load preferences and sync with background active recording on mount / page reload
  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setIsMicMuted(!s.micAudio);
    });

    // Query active background recording state on load/reload to persist recording across page navigations
    try {
      if (typeof Browser !== "undefined" && Browser.runtime?.sendMessage) {
        Browser.runtime
          .sendMessage({ type: "SRP_GET_STATE" })
          .then((res: unknown) => {
            const update = res as StateUpdateMessage;
            if (update && update.type === "SRP_STATE_UPDATE") {
              if (update.state && update.state !== "IDLE") {
                setTestState(update.state);
                if (
                  update.startedAt &&
                  (update.state === "RECORDING" || update.state === "PAUSED")
                ) {
                  const elapsedSec = Math.floor((Date.now() - update.startedAt) / 1000);
                  setSeconds(Math.max(0, elapsedSec));
                }
                if (typeof update.isMicMuted === "boolean") {
                  setIsMicMuted(update.isMicMuted);
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // Non-extension test environment
    }
  }, []);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoDownloadedRef = useRef<boolean>(false);

  // Automatically trigger download when recording completes
  useEffect(() => {
    if (activeState === "COMPLETED" && activeResult && !hasAutoDownloadedRef.current) {
      hasAutoDownloadedRef.current = true;
      try {
        getSettings().then((s) => {
          downloadBlob(activeResult.blob, activeResult.filename, {
            subfolder: s.downloadSubfolder,
            saveAs: s.downloadLocationPrompt,
          });
        });
      } catch (err) {
        console.error("[Screen Recorder Pro] Failed to trigger auto-download:", err);
      }
    }
    if (activeState !== "COMPLETED") {
      hasAutoDownloadedRef.current = false;
    }
  }, [activeState, activeResult]);

  // Synchronize with background messaging
  useEffect(() => {
    const handleMessage = (msg: unknown) => {
      const message = msg as ExtensionMessage;
      if (!message || typeof message !== "object") return;

      if (message.type === "SRP_STATE_UPDATE") {
        const update = message as StateUpdateMessage;
        setTestState(update.state);
        if (update.result) {
          setBgResult(update.result);
        }
        if (
          update.startedAt &&
          (update.state === "RECORDING" || update.state === "PAUSED")
        ) {
          const elapsedSec = Math.floor((Date.now() - update.startedAt) / 1000);
          setSeconds(Math.max(0, elapsedSec));
        }
        if (typeof update.isMicMuted === "boolean") {
          setIsMicMuted(update.isMicMuted);
        }
      } else if (message.type === "SRP_TOGGLE_WIDGET") {
        setIsMinimized((prev) => !prev);
      }
    };

    try {
      if (Browser?.runtime?.onMessage) {
        Browser.runtime.onMessage.addListener(handleMessage);
      }
    } catch {
      // Non-extension test environment
    }

    return () => {
      try {
        if (Browser?.runtime?.onMessage) {
          Browser.runtime.onMessage.removeListener(handleMessage);
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // Timer counter
  useEffect(() => {
    if (activeState === "RECORDING") {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (activeState === "IDLE") {
        setSeconds(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeState]);

  // Pointer drag handling with viewport clamping
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const newX = e.clientX - dragStartOffsetRef.current.x;
    const newY = e.clientY - dragStartOffsetRef.current.y;

    const maxX = window.innerWidth - 120;
    const maxY = window.innerHeight - 50;

    setPosition({
      x: Math.max(12, Math.min(newX, maxX)),
      y: Math.max(12, Math.min(newY, maxY)),
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  // Toggle mic setting directly from launcher pill
  const handleToggleMicSetting = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !settings.micAudio;
    const updated = await saveSettings({ micAudio: nextVal });
    setSettings(updated);
    setIsMicMuted(!nextVal);
  }, [settings.micAudio]);

  // Live mute/unmute during active recording
  const handleLiveToggleMic = useCallback(() => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    try {
      if (typeof Browser !== "undefined" && Browser.runtime?.sendMessage) {
        Browser.runtime
          .sendMessage({
            type: "SRP_TOGGLE_MIC",
            muted: nextMuted,
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [isMicMuted]);

  // Action Handlers
  const handleStart = useCallback(async () => {
    onStart?.();
    const currentSettings = await getSettings();
    const opts = {
      format: currentSettings.format,
      quality: currentSettings.quality,
      videoBitsPerSecond: QUALITY_PRESETS[currentSettings.quality]?.bitrate,
      frameRate: currentSettings.frameRate,
      audio: currentSettings.systemAudio ?? currentSettings.audio,
      micAudio: currentSettings.micAudio,
      micDeviceId: currentSettings.micDeviceId,
      audioOutputDeviceId: currentSettings.audioOutputDeviceId,
      filenamePrefix: currentSettings.filenamePrefix,
    };

    // Forward to background to ensure persistent recording across page reloads
    let forwardedToExtension = false;
    try {
      if (typeof Browser !== "undefined" && Browser.runtime?.id && Browser.runtime?.sendMessage) {
        Browser.runtime
          .sendMessage({
            type: "SRP_START_RECORDING",
            options: opts,
          })
          .catch(() => {});
        forwardedToExtension = true;
      }
    } catch {
      // ignore
    }

    if (!forwardedToExtension) {
      startRecording(opts);
    }
  }, [onStart, startRecording]);

  const handlePauseResume = useCallback(() => {
    if (activeState === "RECORDING") {
      onPause?.();
      pauseRecording();
      setTestState("PAUSED");
      try {
        Browser.runtime?.sendMessage({ type: "SRP_PAUSE_RECORDING" }).catch(() => {});
      } catch {}
    } else if (activeState === "PAUSED") {
      onResume?.();
      resumeRecording();
      setTestState("RECORDING");
      try {
        Browser.runtime?.sendMessage({ type: "SRP_RESUME_RECORDING" }).catch(() => {});
      } catch {}
    }
  }, [activeState, onPause, onResume, pauseRecording, resumeRecording]);

  const handleStop = useCallback(() => {
    onStop?.();
    stopRecording();
    setTestState("COMPLETED");
    try {
      Browser.runtime?.sendMessage({ type: "SRP_STOP_RECORDING" }).catch(() => {});
    } catch {}
  }, [onStop, stopRecording]);

  const handleCancel = useCallback(() => {
    let confirmCancel = true;
    if (confirmHandler) {
      confirmCancel = confirmHandler("Discard this screen recording?");
    } else if (typeof window !== "undefined" && typeof window.confirm === "function") {
      confirmCancel = window.confirm("Discard this screen recording?");
    }

    if (confirmCancel) {
      onCancel?.();
      cancelRecording();
      setTestState("IDLE");
      setSeconds(0);
      try {
        Browser.runtime?.sendMessage({ type: "SRP_CANCEL_RECORDING" }).catch(() => {});
      } catch {}
    }
  }, [confirmHandler, onCancel, cancelRecording]);

  const handleDownloadAgain = useCallback(async () => {
    const s = await getSettings();
    if (activeResult) {
      downloadBlob(activeResult.blob, activeResult.filename, {
        subfolder: s.downloadSubfolder,
        saveAs: s.downloadLocationPrompt,
      });
    }
  }, [activeResult]);

  const handleReset = useCallback(() => {
    resetRecording();
    setBgResult(null);
    setTestState("IDLE");
    setSeconds(0);
    try {
      Browser.runtime?.sendMessage({ type: "SRP_CANCEL_RECORDING" }).catch(() => {});
    } catch {}
  }, [resetRecording]);

  const isPaused = activeState === "PAUSED";

  const dragHandleProps = {
    className: "srp-drag-handle",
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    title: "Drag to reposition",
    role: "button" as const,
    "aria-label": "Drag handle",
    tabIndex: 0,
    children: (
      <div className="srp-drag-dots">
        <div className="srp-drag-dot" />
        <div className="srp-drag-dot" />
        <div className="srp-drag-dot" />
        <div className="srp-drag-dot" />
        <div className="srp-drag-dot" />
        <div className="srp-drag-dot" />
      </div>
    ),
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 2147483647,
      }}
    >
      {/* 1. Minimized floating bubble */}
      {isMinimized ? (
        <div
          className="srp-collapsed-bubble"
          onClick={() => setIsMinimized(false)}
          title="Click to expand controls"
          role="button"
          tabIndex={0}
        >
          <div
            className={`srp-indicator-dot ${isPaused ? "paused" : "recording"}`}
          />
          <span className="srp-timer">{formatSeconds(seconds)}</span>
        </div>
      ) : activeState === "IDLE" ? (
        /* 2. IDLE State: Sleek Launch Record Pill */
        <div className="srp-idle-pill" role="toolbar" aria-label="Screen recorder launcher">
          <div {...dragHandleProps} />
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={handleStart}
            role="button"
            aria-label="Start recording"
            tabIndex={0}
          >
            <div className="srp-idle-record-dot" />
            <span className="srp-idle-label">Record Screen</span>
          </div>

          {/* Dedicated Mic Toggle Button in launcher pill */}
          <button
            type="button"
            className={`srp-btn-mic-toggle ${settings.micAudio ? "active" : "muted"}`}
            onClick={handleToggleMicSetting}
            title={settings.micAudio ? "Microphone: ON (click to mute)" : "Microphone: OFF (click to enable)"}
            aria-label={settings.micAudio ? "Disable microphone" : "Enable microphone"}
          >
            {settings.micAudio ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17L14.9 11.1c.06-.36.1-.73.1-1.1V5c0-1.66-1.34-3-3-3-.94 0-1.78.44-2.33 1.12l5.31 5.05zm-4.98 4.98c-1.66 0-3-1.34-3-3V11H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c1.07-.15 2.07-.58 2.92-1.22l-1.44-1.44c-.45.36-.95.63-1.48.74v-.85zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l4.07 4.07 1.27-1.27L4.27 3z" />
              </svg>
            )}
          </button>
        </div>
      ) : activeState === "REQUESTING_PERMISSION" ? (
        /* 3. REQUESTING_PERMISSION State: Spinner feedback */
        <div className="srp-floating-dock" role="status" aria-label="Selecting screen">
          <div {...dragHandleProps} />
          <div className="srp-spinner" />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#e2e8f0" }}>
            Select screen...
          </span>
        </div>
      ) : activeState === "STOPPING" ? (
        /* 4. STOPPING State: Visual feedback that recording is saving */
        <div className="srp-floating-dock" role="status" aria-label="Saving recording">
          <div {...dragHandleProps} />
          <div className="srp-spinner" />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#e2e8f0" }}>
            Saving recording...
          </span>
        </div>
      ) : activeState === "COMPLETED" ? (
        /* 5. COMPLETED State: Download & New Recording Controls */
        <div className="srp-completed-pill" role="status" aria-label="Recording complete">
          <div {...dragHandleProps} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>
            ✓ Ready
          </span>
          <button
            type="button"
            className="srp-btn-download"
            onClick={handleDownloadAgain}
            title={result?.filename || "Download recording"}
          >
            Download
          </button>
          <button
            type="button"
            className="srp-btn-close"
            onClick={handleReset}
            title="New Recording"
            aria-label="New recording"
          >
            ✕
          </button>
        </div>
      ) : activeState === "ERROR" ? (
        /* 6. ERROR State */
        <div className="srp-idle-pill" role="alert">
          <div {...dragHandleProps} />
          <span style={{ color: "#f87171", fontSize: "12px" }}>
            {error?.message || "Recording cancelled"}
          </span>
          <button
            type="button"
            className="srp-btn-close"
            onClick={handleReset}
            title="Try again"
          >
            ✕
          </button>
        </div>
      ) : (
        /* 7. Active RECORDING or PAUSED State: Full Controls Toolbar */
        <div className="srp-floating-dock" role="toolbar" aria-label="Recording controls">
          <div {...dragHandleProps} />

          {/* Status Indicator & Live Timer */}
          <div className="srp-indicator-group">
            <div
              className={`srp-indicator-dot ${isPaused ? "paused" : "recording"}`}
            />
            <span className="srp-timer" data-testid="srp-timer">
              {formatSeconds(seconds)}
            </span>
          </div>

          <div className="srp-divider" />

          {/* Controls */}
          <div className="srp-actions">
            {/* Pause / Resume */}
            <button
              type="button"
              className={`srp-btn srp-btn-pause ${isPaused ? "active" : ""}`}
              onClick={handlePauseResume}
              data-tooltip={isPaused ? "Resume" : "Pause"}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            {/* Stop & Save */}
            <button
              type="button"
              className="srp-btn srp-btn-stop"
              onClick={handleStop}
              data-tooltip="Stop & Save"
              aria-label="Stop recording"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>

            {/* Discard / Cancel */}
            <button
              type="button"
              className="srp-btn srp-btn-discard"
              onClick={handleCancel}
              data-tooltip="Discard"
              aria-label="Discard recording"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>

            {/* Live Microphone Toggle */}
            <button
              type="button"
              className={`srp-btn ${isMicMuted ? "mic-muted" : "mic-active"}`}
              onClick={handleLiveToggleMic}
              data-tooltip={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMicMuted ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17L14.9 11.1c.06-.36.1-.73.1-1.1V5c0-1.66-1.34-3-3-3-.94 0-1.78.44-2.33 1.12l5.31 5.05zm-4.98 4.98c-1.66 0-3-1.34-3-3V11H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c1.07-.15 2.07-.58 2.92-1.22l-1.44-1.44c-.45.36-.95.63-1.48.74v-.85zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l4.07 4.07 1.27-1.27L4.27 3z" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>

            <div className="srp-divider" />

            {/* Minimize */}
            <button
              type="button"
              className="srp-btn"
              onClick={() => setIsMinimized(true)}
              data-tooltip="Minimize"
              aria-label="Minimize floating controls"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
