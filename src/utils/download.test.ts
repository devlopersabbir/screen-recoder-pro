import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Browser from "webextension-polyfill";
import { generateFilename, downloadBlob } from "./download";

vi.mock("webextension-polyfill", () => ({
  default: {
    downloads: {
      download: vi.fn().mockResolvedValue(123),
    },
  },
}));

describe("download utility", () => {
  describe("generateFilename", () => {
    it("should format filename correctly with single digit months and dates (defaulting to mp4)", () => {
      // 2026-03-05 09:07
      const date = new Date(2026, 2, 5, 9, 7);
      const filename = generateFilename(date);
      expect(filename).toBe("screen-recording-2026-03-05-09-07.mp4");
    });

    it("should format filename correctly with double digit months and dates", () => {
      // 2026-11-25 18:45
      const date = new Date(2026, 10, 25, 18, 45);
      const filename = generateFilename(date);
      expect(filename).toBe("screen-recording-2026-11-25-18-45.mp4");
    });

    it("should support custom extension", () => {
      const date = new Date(2026, 0, 1, 0, 0);
      const filename = generateFilename(date, "webm");
      expect(filename).toBe("screen-recording-2026-01-01-00-00.webm");
    });

    it("should support custom prefix", () => {
      const date = new Date(2026, 0, 1, 0, 0);
      const filename = generateFilename(date, "mp4", "meeting");
      expect(filename).toBe("meeting-2026-01-01-00-00.mp4");
    });

    it("should default to current date when not provided", () => {
      const filename = generateFilename();
      expect(filename).toMatch(/^screen-recording-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.mp4$/);
    });
  });

  describe("downloadBlob", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it("should route through Browser.downloads.download with subfolder and saveAs options when available", async () => {
      const mockDownload = vi.fn().mockResolvedValue(123);
      (Browser as any).downloads = {
        download: mockDownload,
      };

      const blob = new Blob(["test"], { type: "video/mp4" });
      await downloadBlob(blob, "recording.mp4", {
        subfolder: "ScreenRecordings",
        saveAs: true,
      });

      expect(mockDownload).toHaveBeenCalledWith({
        url: "blob:mock-url",
        filename: "ScreenRecordings/recording.mp4",
        saveAs: true,
      });
    });

    it("should fall back to DOM anchor click when Browser.downloads is not available", async () => {
      const originalDownloads = Browser.downloads;
      (Browser as any).downloads = undefined;

      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === "a") {
          el.click = mockClick;
        }
        return el;
      });

      const blob = new Blob(["test"], { type: "video/mp4" });
      await downloadBlob(blob, "test-recording.mp4");

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockClick).toHaveBeenCalledTimes(1);

      (Browser as any).downloads = originalDownloads;
    });
  });
});
