import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { StartButton } from "./StartButton";

describe("StartButton Component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders idle state correctly", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<StartButton onClick={handleClick} />);

    const button = getByRole("button", { name: /start recording/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders loading state correctly", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<StartButton onClick={handleClick} isLoading={true} />);

    const button = getByRole("button", { name: /requesting screen/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
