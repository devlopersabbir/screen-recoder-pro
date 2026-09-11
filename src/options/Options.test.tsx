import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Options } from "./Options";

describe("Options Component", () => {
  it("renders Hello World placeholder header", () => {
    const { getByText } = render(<Options />);

    expect(getByText("Hello World")).toBeInTheDocument();
    expect(
      getByText("Screen Recorder Pro Options Page")
    ).toBeInTheDocument();
  });
});
