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

const log = createLogger("RecorderService");

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export class RecorderService {
  private state: RecordingState = "IDLE";
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private selectedMimeType: string = "";

  private snapshot: RecorderSnapshot = {
    state: "IDLE",
    result: null,
    error: null,
  };

  private snapshotListeners: Set<() => void> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private completeListeners: Set<CompleteListener> = new Set();

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
   * Identifies the best supported WebM MIME type available in the browser.
   */
  public getBestSupportedMimeType(): string {
    if (typeof MediaRecorder === "undefined") {
      return "";
    }
    for (const mime of MIME_CANDIDATES) {
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

    const mimeType = this.getBestSupportedMimeType();
    if (!mimeType) {
      this.emitError(
        "NO_SUPPORTED_MIME_TYPE",
        "No supported WebM recording formats found in this browser."
      );
      return;
    }
    this.selectedMimeType = mimeType;

    this.setState("REQUESTING_PERMISSION");
    this.recordedChunks = [];

    try {
      // Prompt native screen-sharing picker
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
        },
        audio: options.audio ?? true,
      });

      this.mediaStream = stream;

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

      // Initialize MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType });
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
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn("Failed to stop MediaRecorder cleanly", e);
      }
    } else {
      this.finalizeRecording();
    }
  }

  /**
   * Finalizes recording Blob, creates object URL, and notifies listeners.
   */
  private finalizeRecording(): void {
    const durationMs = Date.now() - this.startTime;
    const mimeType = this.selectedMimeType || "video/webm";

    // Clean up tracks first
    this.cleanupTracks();

    if (this.recordedChunks.length === 0) {
      this.emitError("EMPTY_RECORDING", "No recording data was captured.");
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const filename = generateFilename(new Date(), "webm");

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
