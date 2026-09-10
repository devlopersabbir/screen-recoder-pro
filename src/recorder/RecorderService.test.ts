import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecorderService } from "./RecorderService";
import { RecorderError, RecordingResult, RecordingState } from "./types";

class MockMediaStreamTrack {
  public kind: string;
  public listeners: Record<string, Function[]> = {};
  public stopped = false;

  constructor(kind: string) {
    this.kind = kind;
  }

  public addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  public stop() {
    this.stopped = true;
  }

  public triggerEnded() {
    if (this.listeners["ended"]) {
      this.listeners["ended"].forEach((cb) => cb());
    }
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [];

  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.tracks = tracks;
  }

  public getTracks(): MockMediaStreamTrack[] {
    return this.tracks;
  }

  public getVideoTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === "video");
  }

  public getAudioTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === "audio");
  }
}

class MockMediaRecorder {
  public static isTypeSupported = vi.fn().mockImplementation((type: string) => {
    return type.includes("webm");
  });

  public stream: any;
  public options: any;
  public state: "inactive" | "recording" | "paused" = "inactive";
  public ondataavailable: ((event: any) => void) | null = null;
  public onstop: (() => void) | null = null;
  public onerror: (() => void) | null = null;

  constructor(stream: any, options: any) {
    this.stream = stream;
    this.options = options;
  }

  public start(_timeslice?: number) {
    this.state = "recording";
  }

  public stop() {
    this.state = "inactive";
    if (this.onstop) {
      this.onstop();
    }
  }
}

describe("RecorderService", () => {
  let service: RecorderService;
  let mockVideoTrack: MockMediaStreamTrack;
  let mockAudioTrack: MockMediaStreamTrack;
  let mockStream: MockMediaStream;

  beforeEach(() => {
    service = new RecorderService();
    mockVideoTrack = new MockMediaStreamTrack("video");
    mockAudioTrack = new MockMediaStreamTrack("audio");
    mockStream = new MockMediaStream([mockVideoTrack, mockAudioTrack]);

    // Setup MediaRecorder global
    (globalThis as any).MediaRecorder = MockMediaRecorder;
    MockMediaRecorder.isTypeSupported.mockImplementation((type: string) =>
      type.includes("webm")
    );

    // Setup navigator.mediaDevices
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    // Mock URL methods
    (globalThis as any).URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url");
    (globalThis as any).URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State & Listeners", () => {
    it("should initialize in IDLE state", () => {
      expect(service.getState()).toBe("IDLE");
    });

    it("should notify state listeners on state changes and support unsubscription", () => {
      const stateHistory: RecordingState[] = [];
      const unsubscribe = service.onStateChange((state) => {
        stateHistory.push(state);
      });

      // Trigger state change via reset
      service.reset();
      expect(stateHistory).toEqual(["IDLE"]);

      unsubscribe();
      service.reset();
      expect(stateHistory.length).toBe(1);
    });

    it("should notify error listeners and support unsubscription", async () => {
      const errors: RecorderError[] = [];
      const unsubscribe = service.onError((err) => {
        errors.push(err);
      });

      // Force unsupported environment
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await service.startRecording();
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe("MEDIA_RECORDER_UNSUPPORTED");
      expect(service.getState()).toBe("ERROR");

      unsubscribe();
      service.reset();
      await service.startRecording();
      expect(errors.length).toBe(1); // No new listener call
    });

    it("should notify complete listeners on recording completion and support unsubscription", async () => {
      let completeResult: RecordingResult | null = null;
      const unsubscribe = service.onComplete((result) => {
        completeResult = result;
      });

      await service.startRecording();

      // Simulate chunk data
      const recorderInstance = (service as any).mediaRecorder;
      recorderInstance.ondataavailable({
        data: new Blob(["sample data"], { type: "video/webm" }),
      });

      service.stopRecording();

      expect(completeResult).not.toBeNull();
      expect(completeResult!.url).toBe("blob:test-url");
      expect(completeResult!.mimeType).toContain("video/webm");
      expect(service.getState()).toBe("COMPLETED");

      unsubscribe();
    });
  });

  describe("MIME Type Selection", () => {
    it("should return the highest priority supported MIME type", () => {
      MockMediaRecorder.isTypeSupported.mockImplementation(
        (mime: string) => mime === "video/webm;codecs=vp8"
      );
      const mime = service.getBestSupportedMimeType();
      expect(mime).toBe("video/webm;codecs=vp8");
    });

    it("should return empty string if no candidate is supported", () => {
      MockMediaRecorder.isTypeSupported.mockReturnValue(false);
      const mime = service.getBestSupportedMimeType();
      expect(mime).toBe("");
    });

    it("should return empty string if MediaRecorder is undefined", () => {
      const original = (globalThis as any).MediaRecorder;
      (globalThis as any).MediaRecorder = undefined;
      const mime = service.getBestSupportedMimeType();
      expect(mime).toBe("");
      (globalThis as any).MediaRecorder = original;
    });
  });

  describe("startRecording Flow", () => {
    it("should transition from IDLE -> REQUESTING_PERMISSION -> RECORDING", async () => {
      const states: RecordingState[] = [];
      service.onStateChange((s) => states.push(s));

      await service.startRecording();

      expect(states).toContain("REQUESTING_PERMISSION");
      expect(states).toContain("RECORDING");
      expect(service.getState()).toBe("RECORDING");
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
        video: { displaySurface: "monitor" },
        audio: true,
      });
    });

    it("should not re-request if already RECORDING or REQUESTING_PERMISSION", async () => {
      await service.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledTimes(1);

      await service.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledTimes(1);
    });

    it("should handle user cancelling the screen picker (NotAllowedError)", async () => {
      const notAllowedError = new DOMException("Permission denied", "NotAllowedError");
      (navigator.mediaDevices.getDisplayMedia as any).mockRejectedValueOnce(notAllowedError);

      let capturedError: RecorderError | null = null;
      service.onError((err) => (capturedError = err));

      await service.startRecording();

      expect(service.getState()).toBe("ERROR");
      expect(capturedError).not.toBeNull();
      expect(capturedError!.code).toBe("USER_CANCELLED");
      expect(capturedError!.message).toContain("cancelled");
    });

    it("should handle capture source not found (NotFoundError)", async () => {
      const notFoundError = new DOMException("No screens", "NotFoundError");
      (navigator.mediaDevices.getDisplayMedia as any).mockRejectedValueOnce(notFoundError);

      let capturedError: RecorderError | null = null;
      service.onError((err) => (capturedError = err));

      await service.startRecording();

      expect(service.getState()).toBe("ERROR");
      expect(capturedError).not.toBeNull();
      expect(capturedError!.code).toBe("INITIALIZATION_FAILED");
    });

    it("should handle unsupported MIME type error", async () => {
      MockMediaRecorder.isTypeSupported.mockReturnValue(false);

      let capturedError: RecorderError | null = null;
      service.onError((err) => (capturedError = err));

      await service.startRecording();

      expect(service.getState()).toBe("ERROR");
      expect(capturedError!.code).toBe("NO_SUPPORTED_MIME_TYPE");
    });
  });

  describe("Stream Termination & Native Stop Sharing", () => {
    it("should automatically finalize recording when user clicks native Stop Sharing", async () => {
      await service.startRecording();
      expect(service.getState()).toBe("RECORDING");

      // Inject chunk
      const recorderInstance = (service as any).mediaRecorder;
      recorderInstance.ondataavailable({
        data: new Blob(["video chunk"], { type: "video/webm" }),
      });

      // Trigger native track ended event
      mockVideoTrack.triggerEnded();

      expect(service.getState()).toBe("COMPLETED");
      expect(mockVideoTrack.stopped).toBe(true);
      expect(mockAudioTrack.stopped).toBe(true);
    });
  });

  describe("stopRecording & Finalization", () => {
    it("should emit EMPTY_RECORDING error when stopped with 0 chunks captured", async () => {
      await service.startRecording();

      let capturedError: RecorderError | null = null;
      service.onError((err) => (capturedError = err));

      service.stopRecording();

      expect(service.getState()).toBe("ERROR");
      expect(capturedError).not.toBeNull();
      expect(capturedError!.code).toBe("EMPTY_RECORDING");
    });

    it("should do nothing when stopRecording is called on IDLE", () => {
      service.stopRecording();
      expect(service.getState()).toBe("IDLE");
    });
  });

  describe("Reset & Resource Cleanup", () => {
    it("should stop all tracks and reset state to IDLE on reset()", async () => {
      await service.startRecording();
      expect(service.getState()).toBe("RECORDING");

      service.reset();

      expect(service.getState()).toBe("IDLE");
      expect(mockVideoTrack.stopped).toBe(true);
      expect(mockAudioTrack.stopped).toBe(true);
    });
  });
});
