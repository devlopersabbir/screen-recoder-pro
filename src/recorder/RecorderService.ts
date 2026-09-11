import Browser from "webextension-polyfill";
import {
  CompleteListener,
  ErrorListener,
  RecorderError,
  RecorderOptions,
  RecorderSnapshot,
  RecordingResult,
  RecordingState,
  StateChangeListener,
} from "./types";
import { generateFilename } from "../utils/download";
import { createLogger } from "../utils/logger";
import { ExtensionMessage } from "../shared/messages";

const log = createLogger("RecorderService");

const MP4_MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4;codecs=avc1,opus",
  "video/mp4;codecs=avc1",
  "video/mp4;codecs=h264,opus",
  "video/mp4;codecs=h264",
  "video/mp4",
];

const WEBM_MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

const MIME_CANDIDATES = [...MP4_MIME_CANDIDATES, ...WEBM_MIME_CANDIDATES];

export class RecorderService {
  private state: RecordingState = "IDLE";
  private mediaStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private selectedMimeType: string = "";
  private filenamePrefix: string = "screen-recording";

  private snapshot: RecorderSnapshot = {
    state: "IDLE",
    result: null,
    error: null,
  };

  private snapshotListeners: Set<() => void> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private completeListeners: Set<CompleteListener> = new Set();

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener(): void {
    try {
      if (typeof Browser !== "undefined" && Browser.runtime?.onMessage) {
        Browser.runtime.onMessage.addListener((msg: unknown) => {
          const message = msg as ExtensionMessage;
          if (!message || typeof message !== "object") return;
          if (message.type === "SRP_STOP_RECORDING") {
            this.stopRecording();
          } else if (message.type === "SRP_PAUSE_RECORDING") {
            this.pauseRecording();
          } else if (message.type === "SRP_RESUME_RECORDING") {
            this.resumeRecording();
          } else if (message.type === "SRP_CANCEL_RECORDING") {
            this.cancelRecording();
          }
        });
      }
    } catch {
      // ignore in tests or when Browser is not initialized
    }
  }

  private broadcastState(newState: RecordingState): void {
    try {
      if (typeof Browser !== "undefined" && Browser.runtime?.sendMessage) {
        Browser.runtime
          .sendMessage({
            type: "SRP_STATE_UPDATE",
            state: newState,
            isPaused: newState === "PAUSED",
            startedAt: this.startTime,
            durationMs: this.startTime ? Date.now() - this.startTime : 0,
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  public getSnapshot = (): RecorderSnapshot => {
    return this.snapshot;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  };

  public getState(): RecordingState {
    return this.state;
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public onComplete(listener: CompleteListener): () => void {
    this.completeListeners.add(listener);
    return () => this.completeListeners.delete(listener);
  }

  private setState(newState: RecordingState): void {
    log.info(`State transitioning to [${newState}]`);
    this.state = newState;
    this.snapshot = {
      ...this.snapshot,
      state: newState,
      error: newState === "ERROR" ? this.snapshot.error : null,
    };
    this.snapshotListeners.forEach((l) => l());
    this.stateListeners.forEach((listener) => listener(newState));
    this.broadcastState(newState);
  }

  private emitError(code: RecorderError["code"], message: string): void {
    log.error(`Recording error [${code}]: ${message}`);
    const error: RecorderError = { code, message };
    this.snapshot = {
      ...this.snapshot,
      state: "ERROR",
      error,
    };
    this.state = "ERROR";
    this.snapshotListeners.forEach((l) => l());
    this.stateListeners.forEach((listener) => listener("ERROR"));
    this.errorListeners.forEach((listener) => listener(error));
  }

  /**
   * Identifies the best supported MIME type available in the browser,
   * prioritizing the user's preferred format (mp4 or webm).
   */
  public getBestSupportedMimeType(preferredFormat: "mp4" | "webm" = "mp4"): string {
    if (typeof MediaRecorder === "undefined") {
      return "";
    }
    const candidates =
      preferredFormat === "mp4"
        ? [...MP4_MIME_CANDIDATES, ...WEBM_MIME_CANDIDATES]
        : [...WEBM_MIME_CANDIDATES, ...MP4_MIME_CANDIDATES];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return "";
  }

  /**
   * Starts screen recording flow: requests native screen picker,
   * binds track listeners, and begins MediaRecorder.
   */
  public async startRecording(options: RecorderOptions = {}): Promise<void> {
    if (this.state === "RECORDING" || this.state === "REQUESTING_PERMISSION") {
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      this.emitError(
        "MEDIA_RECORDER_UNSUPPORTED",
        "Screen recording is not supported in this browser environment."
      );
      return;
    }

    const preferredFormat = options.format ?? "mp4";
    const mimeType = this.getBestSupportedMimeType(preferredFormat);
    if (!mimeType) {
      this.emitError(
        "NO_SUPPORTED_MIME_TYPE",
        "No supported recording formats found in this browser."
      );
      return;
    }
    this.selectedMimeType = mimeType;

    this.setState("REQUESTING_PERMISSION");
    this.recordedChunks = [];

    // Map quality preset or custom bitrate (default: 8 Mbps high definition)
    let videoBitsPerSecond = options.videoBitsPerSecond;
    if (!videoBitsPerSecond) {
      if (options.quality === "ultra") {
        videoBitsPerSecond = 16_000_000; // 16 Mbps for 4K / Ultra HD
      } else if (options.quality === "standard") {
        videoBitsPerSecond = 4_000_000; // 4 Mbps
      } else {
        videoBitsPerSecond = 8_000_000; // 8 Mbps High Definition default
      }
    }

    const frameRate = options.frameRate ?? (options.quality === "standard" ? 30 : 60);

    try {
      // Prompt native screen-sharing picker with high-fidelity constraints
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: frameRate, max: frameRate },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
        audio: options.audio ?? true,
      });

      this.mediaStream = stream;
      this.filenamePrefix = options.filenamePrefix || "screen-recording";

      let finalStream = stream;
      if (options.micAudio && navigator.mediaDevices?.getUserMedia) {
        try {
          let mic: MediaStream | null = null;
          const targetDeviceId =
            options.micDeviceId && options.micDeviceId !== "default"
              ? options.micDeviceId
              : undefined;

          try {
            mic = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: targetDeviceId ? { ideal: targetDeviceId } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          } catch (micErr) {
            log.warn("Microphone request with constraints failed, falling back to default", micErr);
            mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          }

          this.micStream = mic;
          const micTrack = mic.getAudioTracks()[0];
          const sysTrack = stream.getAudioTracks()[0];

          if (micTrack && sysTrack && typeof AudioContext !== "undefined") {
            const audioCtx = new AudioContext();
            this.audioContext = audioCtx;
            const dest = audioCtx.createMediaStreamDestination();
            const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysTrack]));
            const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
            sysSource.connect(dest);
            micSource.connect(dest);

            const mixedAudioTrack = dest.stream.getAudioTracks()[0];
            finalStream = new MediaStream([
              ...stream.getVideoTracks(),
              mixedAudioTrack,
            ]);
          } else if (micTrack && !sysTrack) {
            finalStream = new MediaStream([
              ...stream.getVideoTracks(),
              micTrack,
            ]);
          }
        } catch (e) {
          log.warn("Microphone capture skipped or denied:", e);
        }
      }

      // Handle user manually clicking browser's native "Stop sharing" button
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          // If still recording when track ends, cleanly stop and finalize
          if (this.state === "RECORDING" || this.state === "PAUSED") {
            this.stopRecording();
          }
        });
      }

      // Initialize MediaRecorder with high bitrate and crisp audio
      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond: options.audioBitsPerSecond ?? 128_000,
      });
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        this.emitError("INITIALIZATION_FAILED", "MediaRecorder encountered an error.");
        this.cleanup();
      };

      recorder.onstop = () => {
        this.finalizeRecording();
      };

      // Request chunks every 1000ms for responsiveness
      recorder.start(1000);
      this.startTime = Date.now();
      this.setState("RECORDING");
    } catch (err: unknown) {
      this.cleanup();

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          this.emitError(
            "USER_CANCELLED",
            "Screen selection was cancelled or permission was denied."
          );
          return;
        }
        if (err.name === "NotFoundError") {
          this.emitError("INITIALIZATION_FAILED", "No capture sources were found.");
          return;
        }
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to start screen recording.";
      this.emitError("UNKNOWN", errorMessage);
    }
  }

  /**
   * Stops the active recording cleanly.
   */
  public stopRecording(): void {
    if (this.state !== "RECORDING" && this.state !== "PAUSED") {
      return;
    }

    this.setState("STOPPING");

    // Stop recorder which triggers onstop
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        if (typeof this.mediaRecorder.requestData === "function") {
          try {
            this.mediaRecorder.requestData();
          } catch {
            // ignore if not supported in test environment
          }
        }
        this.mediaRecorder.stop();
      } catch (e) {
        log.warn("Failed to stop MediaRecorder cleanly, forcing finalization", e);
        this.finalizeRecording();
      }
    } else {
      this.finalizeRecording();
    }
  }

  /**
   * Pauses an active recording session.
   */
  public pauseRecording(): void {
    if (this.state !== "RECORDING" || !this.mediaRecorder) {
      return;
    }
    if (this.mediaRecorder.state === "recording") {
      try {
        this.mediaRecorder.pause();
      } catch (e) {
        log.warn("Failed to pause MediaRecorder", e);
      }
    }
    this.setState("PAUSED");
  }

  /**
   * Resumes a paused recording session.
   */
  public resumeRecording(): void {
    if (this.state !== "PAUSED" || !this.mediaRecorder) {
      return;
    }
    if (this.mediaRecorder.state === "paused") {
      try {
        this.mediaRecorder.resume();
      } catch (e) {
        log.warn("Failed to resume MediaRecorder", e);
      }
    }
    this.setState("RECORDING");
  }

  /**
   * Cancels and discards the active recording session without saving.
   */
  public cancelRecording(): void {
    if (this.state !== "RECORDING" && this.state !== "PAUSED") {
      return;
    }
    this.cleanup();
    this.recordedChunks = [];
    this.setState("IDLE");
  }

  public getStartTime(): number {
    return this.startTime;
  }

  /**
   * Finalizes recording Blob, creates object URL, and notifies listeners.
   */
  private finalizeRecording(): void {
    const durationMs = Date.now() - this.startTime;
    const mimeType = this.selectedMimeType || "video/mp4";

    // Clean up tracks first
    this.cleanupTracks();

    if (this.recordedChunks.length === 0) {
      this.emitError("EMPTY_RECORDING", "No recording data was captured.");
      return;
    }

    const isMp4 = mimeType.toLowerCase().includes("mp4");
    const extension = isMp4 ? "mp4" : "webm";
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = generateFilename(new Date(), extension, this.filenamePrefix);

    const result: RecordingResult = {
      blob,
      url,
      mimeType,
      filename,
      durationMs,
    };

    this.emitComplete(result);
  }

  private emitComplete(result: RecordingResult): void {
    this.state = "COMPLETED";
    this.snapshot = {
      ...this.snapshot,
      state: "COMPLETED",
      result,
      error: null,
    };
    this.snapshotListeners.forEach((l) => l());
    this.stateListeners.forEach((listener) => listener("COMPLETED"));
    this.completeListeners.forEach((listener) => listener(result));
  }

  /**
   * Stops and releases all media stream tracks.
   */
  private cleanupTracks(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.mediaStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.micStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
  }

  /**
   * Cleans up all resources, listeners, and resets to IDLE.
   */
  public reset(): void {
    this.cleanup();
    this.recordedChunks = [];
    this.snapshot = {
      state: "IDLE",
      result: null,
      error: null,
    };
    this.state = "IDLE";
    this.snapshotListeners.forEach((l) => l());
    this.stateListeners.forEach((listener) => listener("IDLE"));
  }

  private cleanup(): void {
    this.cleanupTracks();
    this.mediaRecorder = null;
  }
}

// Export singleton instance for app-wide recording coordination
export const recorderService = new RecorderService();
