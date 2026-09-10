import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateFilename, downloadBlob } from "./download";

describe("download utility", () => {
  describe("generateFilename", () => {
    it("should format filename correctly with single digit months and dates", () => {
      // 2026-03-05 09:07
      const date = new Date(2026, 2, 5, 9, 7);
      const filename = generateFilename(date);
      expect(filename).toBe("screen-recording-2026-03-05-09-07.webm");
    });

    it("should format filename correctly with double digit months and dates", () => {
      // 2026-11-25 18:45
      const date = new Date(2026, 10, 25, 18, 45);
      const filename = generateFilename(date);
      expect(filename).toBe("screen-recording-2026-11-25-18-45.webm");
    });

    it("should support custom extension", () => {
      const date = new Date(2026, 0, 1, 0, 0);
      const filename = generateFilename(date, "mp4");
      expect(filename).toBe("screen-recording-2026-01-01-00-00.mp4");
    });

    it("should default to current date when not provided", () => {
      const filename = generateFilename();
      expect(filename).toMatch(/^screen-recording-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.webm$/);
    });
  });

  describe("downloadBlob", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      vi.useFakeTimers();
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.useRealTimers();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it("should create anchor, trigger download and revoke object URL", () => {
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === "a") {
          el.click = mockClick;
        }
        return el;
      });

      const blob = new Blob(["test"], { type: "video/webm" });
      downloadBlob(blob, "test-recording.webm");

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockClick).toHaveBeenCalledTimes(1);

      // Fast-forward timeout for cleanup
      vi.advanceTimersByTime(1000);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });
});
