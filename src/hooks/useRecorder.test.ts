import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useRecorder } from "./useRecorder";
import { recorderService } from "../recorder/RecorderService";

describe("useRecorder hook", () => {
  beforeEach(() => {
    recorderService.reset();
  });

  afterEach(() => {
    cleanup();
    recorderService.reset();
  });

  it("should initialize with current recorderService state", () => {
    const { result } = renderHook(() => useRecorder());
    expect(result.current.state).toBe("IDLE");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should reflect state transitions from recorderService", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      // Trigger internal state change via service
      (recorderService as any).setState("RECORDING");
    });

    expect(result.current.state).toBe("RECORDING");
  });

  it("should capture error from recorderService", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      (recorderService as any).emitError("USER_CANCELLED", "User cancelled.");
    });

    expect(result.current.state).toBe("ERROR");
    expect(result.current.error).toEqual({
      code: "USER_CANCELLED",
      message: "User cancelled.",
    });
  });

  it("should capture completion result from recorderService", async () => {
    const { result } = renderHook(() => useRecorder());

    const mockResult = {
      blob: new Blob(["test"], { type: "video/webm" }),
      url: "blob:test",
      mimeType: "video/webm",
      filename: "test.webm",
      durationMs: 1500,
    };

    await act(async () => {
      (recorderService as any).emitComplete(mockResult);
    });

    expect(result.current.state).toBe("COMPLETED");
    expect(result.current.result).toEqual(mockResult);
  });

  it("should reset state and revoke object URL on resetRecording()", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { result } = renderHook(() => useRecorder());

    const mockResult = {
      blob: new Blob(["test"], { type: "video/webm" }),
      url: "blob:test-url",
      mimeType: "video/webm",
      filename: "test.webm",
      durationMs: 1500,
    };

    await act(async () => {
      (recorderService as any).emitComplete(mockResult);
    });

    await act(async () => {
      result.current.resetRecording();
    });

    expect(revokeSpy).toHaveBeenCalledWith("blob:test-url");
    expect(result.current.state).toBe("IDLE");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
