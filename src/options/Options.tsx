import React, { useEffect, useState, useRef } from "react";
import {
  checkFormatSupport,
  DEFAULT_SETTINGS,
  getSettings,
  RecorderSettings,
  saveSettings,
} from "../utils/settings";
import { VideoFormat, VideoQuality } from "../recorder/types";

type SettingsTab = "video" | "audio" | "output";

export const Options: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("video");
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const [savedToast, setSavedToast] = useState(false);
  const [mp4Supported, setMp4Supported] = useState(true);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [hasUnlabeledDevices, setHasUnlabeledDevices] = useState(false);

  // Live Microphone Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micTestRef = useRef<{ ctx: AudioContext; stream: MediaStream; animId: number } | null>(null);

  // Sound Output Test State
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);

  const loadDevices = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioInputs(inputs);
        setAudioOutputs(outputs);
        const unlabeled = inputs.some((d) => !d.label) || outputs.some((d) => !d.label);
        setHasUnlabeledDevices(unlabeled);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
    });
    setMp4Supported(checkFormatSupport("mp4"));
    loadDevices();

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const requestDevicePermission = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
        await loadDevices();
      }
    } catch {
      // ignore
    }
  };

  const handleUpdate = async (updates: Partial<RecorderSettings>) => {
    const updated = await saveSettings(updates);
    setSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const startMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }
    try {
      const constraints =
        settings.micDeviceId && settings.micDeviceId !== "default"
          ? { deviceId: { ideal: settings.micDeviceId } }
          : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);
        const id = requestAnimationFrame(checkLevel);
        if (micTestRef.current) {
          micTestRef.current.animId = id;
        }
      };

      const animId = requestAnimationFrame(checkLevel);
      micTestRef.current = { ctx, stream, animId };
    } catch {
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (micTestRef.current) {
      cancelAnimationFrame(micTestRef.current.animId);
      micTestRef.current.stream.getTracks().forEach((t) => t.stop());
      try {
        micTestRef.current.ctx.close();
      } catch {
        // ignore
      }
      micTestRef.current = null;
    }
    setIsTestingMic(false);
    setMicLevel(0);
  };

  const playTestTone = async () => {
    if (isPlayingTestTone) return;
    setIsPlayingTestTone(true);
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      // If output device selection is supported via sinkId
      if (
        settings.audioOutputDeviceId &&
        settings.audioOutputDeviceId !== "default" &&
        typeof (audioCtx as any).setSinkId === "function"
      ) {
        try {
          await (audioCtx as any).setSinkId(settings.audioOutputDeviceId);
        } catch {
          // ignore
        }
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);

      setTimeout(() => {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
        setIsPlayingTestTone(false);
      }, 650);
    } catch {
      setIsPlayingTestTone(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#080b12",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.08) 0px, transparent 50%)",
        color: "#f1f5f9",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "40px 16px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Header */}
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

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "rgba(18, 24, 38, 0.6)",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
          role="tablist"
        >
          {[
            { id: "video", label: "Video & Format", icon: "🎥" },
            { id: "audio", label: "Audio & Devices", icon: "🎙️" },
            { id: "output", label: "Export & Save", icon: "📁" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: isSelected ? 600 : 500,
                  cursor: "pointer",
                  background: isSelected ? "rgba(255, 255, 255, 0.12)" : "transparent",
                  color: isSelected ? "#ffffff" : "#94a3b8",
                  boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Video Settings Card */}
        {activeTab === "video" && (
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
                    onClick={() => handleUpdate({ format: fmt })}
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
                    ? "4K UHD • 16 Mbps bitrate (Maximum clarity)"
                    : settings.quality === "high"
                    ? "1080p Full HD • 8 Mbps bitrate (Recommended)"
                    : "720p HD • 4 Mbps bitrate (Compact size)"}
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
                    onClick={() => handleUpdate({ quality: item.id as VideoQuality })}
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
                    onClick={() => handleUpdate({ frameRate: fps as 60 | 30 })}
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
        )}

        {/* Tab 2: Audio & Physical Devices Card */}
        {activeTab === "audio" && (
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

              <div
                onClick={() => handleUpdate({ micAudio: !settings.micAudio })}
                role="switch"
                aria-checked={settings.micAudio}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  background: settings.micAudio ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: settings.micAudio ? "23px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                />
              </div>
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
                  onChange={(e) => handleUpdate({ micDeviceId: e.target.value })}
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
                  onClick={isTestingMic ? stopMicTest : startMicTest}
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

            {/* System Audio Toggle Row */}
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
                  System Audio
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Capture internal tab, app, and meeting sounds
                </div>
              </div>

              <div
                onClick={() => handleUpdate({ systemAudio: !settings.systemAudio })}
                role="switch"
                aria-checked={settings.systemAudio}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  background: settings.systemAudio ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: settings.systemAudio ? "23px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                />
              </div>
            </div>

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
                  onChange={(e) => handleUpdate({ audioOutputDeviceId: e.target.value })}
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
                  onClick={playTestTone}
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
                  onClick={requestDevicePermission}
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
          </div>
        )}

        {/* Tab 3: Export & Storage Card */}
        {activeTab === "output" && (
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
                onChange={(e) => handleUpdate({ filenamePrefix: e.target.value })}
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
                  onChange={(e) => handleUpdate({ downloadSubfolder: e.target.value })}
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
                  {["ScreenRecordings", "Videos", "Captures", ""].map((preset) => (
                    <button
                      key={preset || "root"}
                      type="button"
                      onClick={() => handleUpdate({ downloadSubfolder: preset })}
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

              <div
                onClick={() =>
                  handleUpdate({
                    downloadLocationPrompt: !settings.downloadLocationPrompt,
                  })
                }
                role="switch"
                aria-checked={settings.downloadLocationPrompt}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  background: settings.downloadLocationPrompt
                    ? "#ef4444"
                    : "rgba(255, 255, 255, 0.15)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: settings.downloadLocationPrompt ? "23px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
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
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
