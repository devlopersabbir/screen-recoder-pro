/**
 * Generates a timestamped filename conforming to:
 * screen-recording-YYYY-MM-DD-HH-mm.webm
 */
export function generateFilename(date: Date = new Date(), extension = "webm"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `screen-recording-${year}-${month}-${day}-${hours}-${minutes}.${extension}`;
}

/**
 * Triggers a native browser download for a Blob and cleans up the Object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}
