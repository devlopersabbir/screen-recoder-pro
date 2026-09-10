import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { App } from "./App";
import { recorderService } from "../recorder/RecorderService";

describe("Popup App Component", () => {
  beforeEach(() => {
    recorderService.reset();
  });

  afterEach(() => {
    cleanup();
    recorderService.reset();
  });

  it("renders header with title and version badge v0.0.1", () => {
    const { getByText } = render(<App />);

    expect(getByText("Screen Recorder")).toBeInTheDocument();
    expect(getByText("v0.0.1")).toBeInTheDocument();
    expect(getByText("100% Offline & Private")).toBeInTheDocument();
  });

  it("renders IDLE state with Start button and triggers recording on click", async () => {
    const startSpy = vi
      .spyOn(recorderService, "startRecording")
      .mockResolvedValue();

    const { getByText, getByRole } = render(<App />);

    expect(getByText("Ready to record")).toBeInTheDocument();
    const startButton = getByRole("button", { name: /start recording/i });
    expect(startButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it("renders REQUESTING_PERMISSION state with loading indicator", async () => {
    const { getByText, getByRole } = render(<App />);

    await act(async () => {
      (recorderService as any).setState("REQUESTING_PERMISSION");
    });

    expect(getByText("Select Screen")).toBeInTheDocument();
    expect(getByRole("button", { name: /requesting screen/i })).toBeDisabled();
  });

  it("renders RECORDING state with active indicator and Stop button", async () => {
    const stopSpy = vi.spyOn(recorderService, "stopRecording").mockImplementation(() => {});

    const { getByText, getByRole } = render(<App />);

    await act(async () => {
      (recorderService as any).setState("RECORDING");
    });

    expect(getByText(/recording in progress/i)).toBeInTheDocument();
    const stopButton = getByRole("button", { name: /stop recording/i });
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it("renders COMPLETED state with Download and Record Again buttons", async () => {
    const mockResult = {
      blob: new Blob(["sample"], { type: "video/webm" }),
      url: "blob:test-recording",
      mimeType: "video/webm",
      filename: "screen-recording-2026-09-10-12-00.webm",
      durationMs: 3000,
    };

    const { getByText, getByRole } = render(<App />);

    await act(async () => {
      (recorderService as any).emitComplete(mockResult);
    });

    expect(getByText("Recording Complete")).toBeInTheDocument();
    expect(getByText("screen-recording-2026-09-10-12-00.webm")).toBeInTheDocument();

    const downloadButton = getByRole("button", {
      name: /download recording/i,
    });
    const recordAgainButton = getByRole("button", {
      name: /record again/i,
    });

    expect(downloadButton).toBeInTheDocument();
    expect(recordAgainButton).toBeInTheDocument();

    // Clicking record again should reset to IDLE
    await act(async () => {
      fireEvent.click(recordAgainButton);
    });
    expect(getByText("Ready to record")).toBeInTheDocument();
  });

  it("renders ERROR state with error banner and Try Again button", async () => {
    const { getByText, getByRole } = render(<App />);

    await act(async () => {
      (recorderService as any).emitError(
        "USER_CANCELLED",
        "Screen selection was cancelled."
      );
    });

    expect(
      getByText(/Screen selection was cancelled/i)
    ).toBeInTheDocument();

    const tryAgainButton = getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(tryAgainButton);
    });
    expect(getByText("Ready to record")).toBeInTheDocument();
  });
});
