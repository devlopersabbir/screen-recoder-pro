export type RecordingState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "RECORDING"
  | "PAUSED"
  | "STOPPING"
  | "COMPLETED"
  | "ERROR";

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  filename: string;
  durationMs: number;
}

export interface RecorderSnapshot {
  state: RecordingState;
  result: RecordingResult | null;
  error: RecorderError | null;
}

export interface RecorderError {
  code:
    | "PERMISSION_DENIED"
    | "USER_CANCELLED"
    | "MEDIA_RECORDER_UNSUPPORTED"
    | "NO_SUPPORTED_MIME_TYPE"
    | "EMPTY_RECORDING"
    | "STREAM_TERMINATED_UNEXPECTEDLY"
    | "INITIALIZATION_FAILED"
    | "UNKNOWN";
  message: string;
}

export type VideoFormat = "mp4" | "webm";
export type VideoQuality = "standard" | "high" | "ultra";

export interface RecorderOptions {
  audio?: boolean;
  micAudio?: boolean;
  micDeviceId?: string;
  audioOutputDeviceId?: string;
  format?: VideoFormat;
  quality?: VideoQuality;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  frameRate?: number;
  filenamePrefix?: string;
}

export type StateChangeListener = (state: RecordingState) => void;
export type ErrorListener = (error: RecorderError) => void;
export type CompleteListener = (result: RecordingResult) => void;
