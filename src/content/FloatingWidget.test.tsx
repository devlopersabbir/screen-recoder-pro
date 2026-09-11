import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { FloatingWidget, formatSeconds } from "./FloatingWidget";

describe("formatSeconds helper", () => {
  it("formats seconds under one minute as MM:SS", () => {
    expect(formatSeconds(0)).toBe("00:00");
    expect(formatSeconds(9)).toBe("00:09");
    expect(formatSeconds(45)).toBe("00:45");
  });

  it("formats minutes and seconds as MM:SS", () => {
    expect(formatSeconds(60)).toBe("01:00");
    expect(formatSeconds(125)).toBe("02:05");
    expect(formatSeconds(3599)).toBe("59:59");
  });

  it("formats hours, minutes, and seconds as HH:MM:SS", () => {
    expect(formatSeconds(3600)).toBe("01:00:00");
    expect(formatSeconds(3665)).toBe("01:01:05");
  });
});

describe("FloatingWidget Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders active recording toolbar with timer and controls", () => {
    const { getByRole, getByTestId } = render(
      <FloatingWidget initialState="RECORDING" />
    );

    expect(getByRole("toolbar", { name: /recording controls/i })).toBeInTheDocument();
    expect(getByTestId("srp-timer")).toHaveTextContent("00:00");
    expect(getByRole("button", { name: /pause recording/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /stop recording/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /discard recording/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /minimize floating controls/i })).toBeInTheDocument();
  });

  it("increments timer every second during active recording", () => {
    const { getByTestId } = render(<FloatingWidget initialState="RECORDING" />);

    expect(getByTestId("srp-timer")).toHaveTextContent("00:00");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(getByTestId("srp-timer")).toHaveTextContent("00:03");
  });

  it("toggles pause and resume when clicking pause button", () => {
    const onPause = vi.fn();
    const onResume = vi.fn();

    const { getByRole } = render(
      <FloatingWidget
        initialState="RECORDING"
        onPause={onPause}
        onResume={onResume}
      />
    );

    const pauseBtn = getByRole("button", { name: /pause recording/i });
    fireEvent.click(pauseBtn);

    expect(onPause).toHaveBeenCalledTimes(1);

    // Should now show resume button
    const resumeBtn = getByRole("button", { name: /resume recording/i });
    expect(resumeBtn).toBeInTheDocument();

    fireEvent.click(resumeBtn);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("calls onStop when clicking Stop & Save button", () => {
    const onStop = vi.fn();
    const { getByRole } = render(
      <FloatingWidget initialState="RECORDING" onStop={onStop} />
    );

    const stopBtn = getByRole("button", { name: /stop recording/i });
    fireEvent.click(stopBtn);

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when confirming discard", () => {
    const onCancel = vi.fn();
    const confirmHandler = vi.fn().mockReturnValue(true);

    const { getByRole } = render(
      <FloatingWidget
        initialState="RECORDING"
        onCancel={onCancel}
        confirmHandler={confirmHandler}
      />
    );

    const discardBtn = getByRole("button", { name: /discard recording/i });
    fireEvent.click(discardBtn);

    expect(confirmHandler).toHaveBeenCalledWith("Discard this screen recording?");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when cancelling discard prompt", () => {
    const onCancel = vi.fn();
    const confirmHandler = vi.fn().mockReturnValue(false);

    const { getByRole } = render(
      <FloatingWidget
        initialState="RECORDING"
        onCancel={onCancel}
        confirmHandler={confirmHandler}
      />
    );

    const discardBtn = getByRole("button", { name: /discard recording/i });
    fireEvent.click(discardBtn);

    expect(confirmHandler).toHaveBeenCalledWith("Discard this screen recording?");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("minimizes into compact bubble and expands on click", () => {
    const { getByRole, queryByRole, getByTitle } = render(
      <FloatingWidget initialState="RECORDING" />
    );

    // Click minimize
    const minBtn = getByRole("button", { name: /minimize floating controls/i });
    fireEvent.click(minBtn);

    // Full toolbar should be replaced with compact bubble
    expect(queryByRole("toolbar")).toBeNull();
    const bubble = getByTitle("Click to expand controls");
    expect(bubble).toBeInTheDocument();

    // Click to expand
    fireEvent.click(bubble);
    expect(getByRole("toolbar")).toBeInTheDocument();
  });

  it("renders launcher pill with Record Screen when in IDLE state and triggers onStart", () => {
    const onStart = vi.fn();
    const { getByRole, getByText } = render(
      <FloatingWidget initialState="IDLE" onStart={onStart} />
    );
    expect(getByRole("toolbar", { name: /screen recorder launcher/i })).toBeInTheDocument();
    expect(getByText("Record Screen")).toBeInTheDocument();

    const startBtn = getByRole("button", { name: /start recording/i });
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("renders ready pill with download button when in COMPLETED state", () => {
    const { getByRole, getByText } = render(
      <FloatingWidget initialState="COMPLETED" />
    );
    expect(getByRole("status", { name: /recording complete/i })).toBeInTheDocument();
    expect(getByText("✓ Ready")).toBeInTheDocument();
    expect(getByRole("button", { name: /download/i })).toBeInTheDocument();
  });
});
