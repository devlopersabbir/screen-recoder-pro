import React, { useState, useEffect, useRef, useCallback } from "react";
import Browser from "webextension-polyfill";
import { useRecorder } from "../hooks/useRecorder";
import { RecordingState } from "../recorder/types";
import {
  ExtensionMessage,
  StateUpdateMessage,
} from "../shared/messages";
import { DEFAULT_SETTINGS, getSettings, QUALITY_PRESETS, RecorderSettings } from "../utils/settings";

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

  // Support manual prop override for unit tests
  const [testState, setTestState] = useState<RecordingState | null>(initialState ?? null);
  const activeState: RecordingState = testState ?? hookState;

  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const [seconds, setSeconds] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return {
      x: 32,
      y: typeof window !== "undefined" ? Math.max(20, window.innerHeight - 80) : 600,
    };
  });

  // Load preferences
  useEffect(() => {
    getSettings().then((s) => setSettings(s));
  }, []);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoDownloadedRef = useRef<boolean>(false);

  // Automatically trigger download when recording completes
  useEffect(() => {
    if (activeState === "COMPLETED" && result && !hasAutoDownloadedRef.current) {
      hasAutoDownloadedRef.current = true;
      try {
        getSettings().then((s) => {
          downloadRecording({
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
  }, [activeState, result, downloadRecording]);

  // Synchronize with background messaging
  useEffect(() => {
    const handleMessage = (msg: unknown) => {
      const message = msg as ExtensionMessage;
      if (!message || typeof message !== "object") return;

      if (message.type === "SRP_STATE_UPDATE") {
        const update = message as StateUpdateMessage;
        if (initialState !== undefined) {
          setTestState(update.state);
        }
        if (update.startedAt && update.state === "RECORDING") {
          const elapsedSec = Math.floor((Date.now() - update.startedAt) / 1000);
          setSeconds(Math.max(0, elapsedSec));
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
  }, [initialState]);

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

  // Action Handlers
  const handleStart = useCallback(async () => {
    onStart?.();
    const currentSettings = await getSettings();
    startRecording({
      format: currentSettings.format,
      quality: currentSettings.quality,
      videoBitsPerSecond: QUALITY_PRESETS[currentSettings.quality]?.bitrate,
      frameRate: currentSettings.frameRate,
      audio: currentSettings.systemAudio ?? currentSettings.audio,
      micAudio: currentSettings.micAudio,
      micDeviceId: currentSettings.micDeviceId,
      audioOutputDeviceId: currentSettings.audioOutputDeviceId,
      filenamePrefix: currentSettings.filenamePrefix,
    });
  }, [onStart, startRecording]);


  const handlePauseResume = useCallback(() => {
    if (activeState === "RECORDING") {
      onPause?.();
      pauseRecording();
      if (initialState !== undefined) {
        setTestState("PAUSED");
      }
    } else if (activeState === "PAUSED") {
      onResume?.();
      resumeRecording();
      if (initialState !== undefined) {
        setTestState("RECORDING");
      }
    }
  }, [activeState, onPause, onResume, pauseRecording, resumeRecording, initialState]);

  const handleStop = useCallback(() => {
    onStop?.();
    stopRecording();
    if (initialState !== undefined) {
      setTestState("COMPLETED");
    }
  }, [onStop, stopRecording, initialState]);

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
      if (initialState !== undefined) {
        setTestState("IDLE");
      }
      setSeconds(0);
    }
  }, [confirmHandler, onCancel, cancelRecording, initialState]);

  const handleDownloadAgain = useCallback(async () => {
    const s = await getSettings();
    downloadRecording({
      subfolder: s.downloadSubfolder,
      saveAs: s.downloadLocationPrompt,
    });
  }, [downloadRecording]);

  const handleReset = useCallback(() => {
    resetRecording();
    if (initialState !== undefined) {
      setTestState("IDLE");
    }
    setSeconds(0);
  }, [resetRecording, initialState]);

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
