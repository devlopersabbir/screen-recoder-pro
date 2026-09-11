import Browser from "webextension-polyfill";

export interface DownloadOptions {
  subfolder?: string;
  saveAs?: boolean;
}

/**
 * Generates a timestamped filename conforming to:
 * [prefix]-YYYY-MM-DD-HH-mm.[extension]
 */
export function generateFilename(
  date: Date = new Date(),
  extension = "mp4",
  prefix = "screen-recording"
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  const cleanPrefix = (prefix || "screen-recording").trim().replace(/[/\\?%*:|"<>]/g, "-") || "screen-recording";
  return `${cleanPrefix}-${year}-${month}-${day}-${hours}-${minutes}.${extension}`;
}

/**
 * Triggers a download for a Blob and cleans up the Object URL.
 * Supports pre-location subfolder and native saveAs prompt via WebExtension downloads API.
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  options: DownloadOptions = {}
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const cleanSubfolder = options.subfolder
    ? options.subfolder.trim().replace(/^[\/\\]+|[\/\\]+$/g, "")
    : "";
  const targetPath = cleanSubfolder ? `${cleanSubfolder}/${filename}` : filename;

  // Use WebExtension downloads API if available for subfolder routing and saveAs dialog control
  if (typeof Browser !== "undefined" && Browser.downloads?.download) {
    try {
      await Browser.downloads.download({
        url,
        filename: targetPath,
        saveAs: options.saveAs ?? false,
      });

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
      return;
    } catch (e) {
      console.warn("[Screen Recorder Pro] Browser.downloads failed, falling back to anchor:", e);
    }
  }

  // Fallback to DOM anchor click
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  const target = document.body || document.documentElement;
  if (target) {
    target.appendChild(anchor);
  }
  anchor.click();

  setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    URL.revokeObjectURL(url);
  }, 1000);
}
