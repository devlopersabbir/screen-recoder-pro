import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RecordingControls } from "./RecordingControls";

describe("RecordingControls Component", () => {
  it("renders active recording state correctly", () => {
    const handleStop = vi.fn();
    const { getByText, getByRole } = render(<RecordingControls onStop={handleStop} />);

    expect(getByText(/recording in progress/i)).toBeInTheDocument();

    const stopButton = getByRole("button", { name: /stop recording/i });
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).not.toBeDisabled();

    fireEvent.click(stopButton);
    expect(handleStop).toHaveBeenCalledTimes(1);
  });

  it("renders stopping state correctly", () => {
    const handleStop = vi.fn();
    const { getByRole } = render(<RecordingControls onStop={handleStop} isStopping={true} />);

    const stopButton = getByRole("button", { name: /stopping/i });
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).toBeDisabled();

    fireEvent.click(stopButton);
    expect(handleStop).not.toHaveBeenCalled();
  });
});
