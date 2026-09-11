import Browser from "webextension-polyfill";
import { VideoFormat, VideoQuality } from "../recorder/types";

export type FrameRate = 30 | 60;

export interface RecorderSettings {
  format: VideoFormat;
  quality: VideoQuality;
  frameRate: FrameRate;
  systemAudio: boolean;
  micAudio: boolean;
  micDeviceId: string;
  audioOutputDeviceId: string;
  filenamePrefix: string;
  downloadSubfolder: string;
  downloadLocationPrompt: boolean;
  // Legacy compatibility
  audio?: boolean;
}

export interface QualityPreset {
  label: string;
  bitrate: number;
  description: string;
}

export const QUALITY_PRESETS: Record<VideoQuality, QualityPreset> = {
  standard: {
    label: "720p (6 Mbps)",
    bitrate: 6_000_000,
    description: "Compact file size",
  },
  high: {
    label: "1080p (12 Mbps)",
    bitrate: 12_000_000,
    description: "Crisp HD (Recommended)",
  },
  ultra: {
    label: "4K (24 Mbps)",
    bitrate: 24_000_000,
    description: "Ultra fidelity",
  },
};

export const DEFAULT_SETTINGS: RecorderSettings = {
  format: "mp4",
  quality: "high",
  frameRate: 60,
  systemAudio: true,
  micAudio: false,
  micDeviceId: "default",
  audioOutputDeviceId: "default",
  filenamePrefix: "screen-recording",
  downloadSubfolder: "ScreenRecordings",
  downloadLocationPrompt: false,
  audio: true,
};

const SETTINGS_KEY = "srp_settings";

/**
 * Checks if a specific container format (mp4 or webm) is supported by the browser's MediaRecorder.
 */
export function checkFormatSupport(format: VideoFormat): boolean {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return false;
  }

  if (format === "mp4") {
    const candidates = [
      "video/mp4;codecs=avc1.640033,mp4a.40.2",
      "video/mp4;codecs=avc1.640033",
      "video/mp4;codecs=avc1.64002a,mp4a.40.2",
      "video/mp4;codecs=avc1.64002a",
      "video/mp4;codecs=avc1.4d402a,mp4a.40.2",
      "video/mp4;codecs=avc1.4d402a",
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4;codecs=avc1,opus",
      "video/mp4;codecs=avc1",
      "video/mp4;codecs=h264,opus",
      "video/mp4;codecs=h264",
      "video/mp4",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1.42E01E",
    ];
    return candidates.some((candidate) => MediaRecorder.isTypeSupported(candidate));
  }

  const webmCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm;codecs=av1,opus",
    "video/webm",
  ];
  return webmCandidates.some((candidate) => MediaRecorder.isTypeSupported(candidate));
}

/**
 * Loads user settings from extension storage with fallback to DEFAULT_SETTINGS.
 */
export async function getSettings(): Promise<RecorderSettings> {
  try {
    if (typeof Browser !== "undefined" && Browser.storage?.local) {
      const data = await Browser.storage.local.get(SETTINGS_KEY);
      if (data && data[SETTINGS_KEY]) {
        const loaded = data[SETTINGS_KEY] as Partial<RecorderSettings>;
        return {
          ...DEFAULT_SETTINGS,
          ...loaded,
          // Support old settings where only `audio` existed
          systemAudio: loaded.systemAudio ?? loaded.audio ?? DEFAULT_SETTINGS.systemAudio,
        };
      }
    }
  } catch {
    // Non-extension or storage unavailable
  }
  return DEFAULT_SETTINGS;
}

/**
 * Persists updated settings to extension storage.
 */
export async function saveSettings(settings: Partial<RecorderSettings>): Promise<RecorderSettings> {
  const current = await getSettings();
  const updated = {
    ...current,
    ...settings,
    audio: settings.systemAudio ?? current.systemAudio,
  };
  try {
    if (typeof Browser !== "undefined" && Browser.storage?.local) {
      await Browser.storage.local.set({ [SETTINGS_KEY]: updated });
    }
  } catch {
    // Non-extension or storage unavailable
  }
  return updated;
}
