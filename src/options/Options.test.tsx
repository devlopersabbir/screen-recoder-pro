import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Options } from "./Options";

describe("Options Component", () => {
  beforeEach(() => {
    (globalThis as any).MediaRecorder = {
      isTypeSupported: vi.fn().mockImplementation((type: string) => true),
    };
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: "audioinput", deviceId: "mic-1", label: "USB Microphone" },
          { kind: "audiooutput", deviceId: "out-1", label: "Headphones" },
        ]),
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it("renders header, tab navigation, and Buy Me a Coffee links", () => {
    const { getByText, getAllByText } = render(<Options />);

    expect(getByText("Screen Recorder Pro")).toBeInTheDocument();
    expect(getByText(/Video & Format/)).toBeInTheDocument();
    expect(getByText(/Audio & Devices/)).toBeInTheDocument();
    expect(getByText(/Export & Save/)).toBeInTheDocument();

    const coffeeButtons = getAllByText(/Buy me a coffee/);
    expect(coffeeButtons.length).toBeGreaterThanOrEqual(1);
    const links = coffeeButtons.map((btn) => btn.closest("a"));
    for (const link of links) {
      expect(link).toHaveAttribute("href", "https://buymeacoffee.com/devlopersabbir");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });


  it("renders video settings on Video tab and allows toggling controls", () => {
    const { getByText } = render(<Options />);

    expect(getByText("Format")).toBeInTheDocument();
    expect(getByText("Quality")).toBeInTheDocument();
    expect(getByText("Frame Rate")).toBeInTheDocument();

    const webmBtn = getByText("webm");
    fireEvent.click(webmBtn);

    const mp4Btn = getByText("mp4");
    fireEvent.click(mp4Btn);

    const q4kBtn = getByText("4K");
    fireEvent.click(q4kBtn);

    const fps30Btn = getByText("30 FPS");
    fireEvent.click(fps30Btn);
  });

  it("navigates to Audio tab and allows selecting physical mic, output, and testing", async () => {
    const { getByText, getByLabelText, getAllByRole } = render(<Options />);

    // Switch to Audio & Devices tab
    const audioTab = getByText(/Audio & Devices/);
    fireEvent.click(audioTab);

    expect(getByText("Microphone Input")).toBeInTheDocument();
    expect(getByText("System Audio")).toBeInTheDocument();
    expect(getByText("Audio Output")).toBeInTheDocument();

    // Select mic
    const micSelect = getByLabelText("Microphone Input Device");
    expect(micSelect).toBeInTheDocument();
    fireEvent.change(micSelect, { target: { value: "mic-1" } });

    // Select output
    const outSelect = getByLabelText("Audio Output Device");
    expect(outSelect).toBeInTheDocument();
    fireEvent.change(outSelect, { target: { value: "out-1" } });

    // Click test mic button
    const testMicBtn = getByText(/Test Mic/);
    expect(testMicBtn).toBeInTheDocument();
    fireEvent.click(testMicBtn);

    // Click test chime button
    const testChimeBtn = getByText(/Play Test Chime/);
    expect(testChimeBtn).toBeInTheDocument();
    fireEvent.click(testChimeBtn);

    // Toggle switches
    const switches = getAllByRole("switch");
    expect(switches.length).toBe(2); // Mic, System audio
    fireEvent.click(switches[0]);
  });

  it("navigates to Export & Save tab and allows updating prefix, subfolder location, and location prompt", () => {
    const { getByText, getByPlaceholderText, getByLabelText, getAllByRole } = render(<Options />);

    // Switch to Export & Save tab
    const exportTab = getByText(/Export & Save/);
    fireEvent.click(exportTab);

    expect(getByText("Filename Prefix")).toBeInTheDocument();
    expect(getByText("Save Location (Subfolder)")).toBeInTheDocument();
    expect(getByText("Ask Save Location")).toBeInTheDocument();

    const prefixInput = getByPlaceholderText("screen-recording");
    expect(prefixInput).toBeInTheDocument();
    fireEvent.change(prefixInput, { target: { value: "tutorial" } });

    // Verify subfolder input & presets
    const subfolderInput = getByLabelText("Download Subfolder Location");
    expect(subfolderInput).toBeInTheDocument();
    fireEvent.change(subfolderInput, { target: { value: "WorkRecordings" } });

    // Click a preset button (e.g. Videos)
    const videosPresetBtn = getByText("Videos");
    fireEvent.click(videosPresetBtn);

    const switches = getAllByRole("switch");
    expect(switches.length).toBe(1); // Ask Save Location
    fireEvent.click(switches[0]);
  });
});
