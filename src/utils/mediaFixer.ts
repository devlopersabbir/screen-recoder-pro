/**
 * Media Duration & Container Fixer for MP4 and WebM
 *
 * Browsers using MediaRecorder generate fragmented streams (fMP4 / fragmented WebM)
 * where duration metadata is missing, infinite, or 0 in initial headers.
 * This utility parses and patches the container headers (mvhd, tkhd, mdhd for MP4,
 * and EBML Segment Info Duration for WebM) to ensure perfect seeking and duration
 * in Windows Media Player, QuickTime, VLC, Discord, and web players.
 */

/**
 * Reads a 4-character ASCII string from DataView at the specified byte offset.
 */
function getFourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

/**
 * Patches MP4 moov atom headers (mvhd, tkhd, mdhd) with accurate duration.
 */
export function patchMp4Duration(buffer: ArrayBuffer, durationMs: number): ArrayBuffer {
  if (buffer.byteLength < 16) return buffer;

  const view = new DataView(buffer);
  let movieTimescale = 1000;

  // Helper to recursively inspect or patch MP4 boxes
  function processBoxes(start: number, end: number): void {
    let offset = start;

    while (offset + 8 <= end) {
      let boxSize = view.getUint32(offset);
      const boxType = getFourCC(view, offset + 4);

      if (boxSize === 0) {
        boxSize = end - offset;
      } else if (boxSize === 1) {
        // 64-bit size
        if (offset + 16 > end) break;
        const high = view.getUint32(offset + 8);
        const low = view.getUint32(offset + 12);
        boxSize = high * 4294967296 + low;
      }

      if (boxSize < 8 || offset + boxSize > end) {
        break;
      }

      const contentStart = offset + 8;
      const contentEnd = offset + boxSize;

      if (boxType === "moov" || boxType === "trak" || boxType === "mdia") {
        processBoxes(contentStart, contentEnd);
      } else if (boxType === "mvhd") {
        // Movie Header Box
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 20 <= contentEnd) {
          movieTimescale = view.getUint32(contentStart + 12) || 1000;
          const targetDuration = Math.round((movieTimescale * durationMs) / 1000);
          view.setUint32(contentStart + 16, targetDuration);
        } else if (version === 1 && contentStart + 28 <= contentEnd) {
          movieTimescale = view.getUint32(contentStart + 20) || 1000;
          const targetDuration = Math.round((movieTimescale * durationMs) / 1000);
          view.setUint32(contentStart + 24, Math.floor(targetDuration / 4294967296));
          view.setUint32(contentStart + 28, targetDuration >>> 0);
        }
      } else if (boxType === "tkhd") {
        // Track Header Box
        const version = view.getUint8(contentStart);
        const targetDuration = Math.round((movieTimescale * durationMs) / 1000);
        if (version === 0 && contentStart + 24 <= contentEnd) {
          view.setUint32(contentStart + 20, targetDuration);
        } else if (version === 1 && contentStart + 32 <= contentEnd) {
          view.setUint32(contentStart + 28, Math.floor(targetDuration / 4294967296));
          view.setUint32(contentStart + 32, targetDuration >>> 0);
        }
      } else if (boxType === "mdhd") {
        // Media Header Box
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 20 <= contentEnd) {
          const mediaTimescale = view.getUint32(contentStart + 12) || movieTimescale;
          const targetDuration = Math.round((mediaTimescale * durationMs) / 1000);
          view.setUint32(contentStart + 16, targetDuration);
        } else if (version === 1 && contentStart + 28 <= contentEnd) {
          const mediaTimescale = view.getUint32(contentStart + 20) || movieTimescale;
          const targetDuration = Math.round((mediaTimescale * durationMs) / 1000);
          view.setUint32(contentStart + 24, Math.floor(targetDuration / 4294967296));
          view.setUint32(contentStart + 28, targetDuration >>> 0);
        }
      }

      offset += boxSize;
    }
  }

  try {
    processBoxes(0, buffer.byteLength);
  } catch {
    // If malformed box encountered, return buffer safely
  }

  return buffer;
}

/**
 * Searches and patches WebM duration in EBML Segment Info.
 */
export function patchWebmDuration(buffer: ArrayBuffer, durationMs: number): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Search for EBML ID 0x4489 (Duration) inside the first 64KB (Segment Info header)
  const maxSearch = Math.min(bytes.length - 6, 65536);
  for (let i = 0; i < maxSearch; i++) {
    if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
      const lenByte = bytes[i + 2];
      if (lenByte === 0x84 && i + 7 <= bytes.length) {
        // 4-byte float32
        view.setFloat32(i + 3, durationMs, false);
        return buffer;
      }
      if (lenByte === 0x88 && i + 11 <= bytes.length) {
        // 8-byte float64
        view.setFloat64(i + 3, durationMs, false);
        return buffer;
      }
    }
  }

  return buffer;
}

/**
 * Fixes duration metadata for recorded media Blob (MP4 or WebM)
 * so video players and editors can seek, scrub, and read exact duration.
 */
export async function fixMediaDuration(
  blob: Blob,
  durationMs: number,
  mimeType: string
): Promise<Blob> {
  if (!durationMs || durationMs <= 0) {
    return blob;
  }

  try {
    const isMp4 = mimeType.toLowerCase().includes("mp4") || blob.type.toLowerCase().includes("mp4");
    const isWebm = mimeType.toLowerCase().includes("webm") || blob.type.toLowerCase().includes("webm");

    if (!isMp4 && !isWebm) {
      return blob;
    }

    const arrayBuffer = await blob.arrayBuffer();
    let patchedBuffer: ArrayBuffer;

    if (isMp4) {
      patchedBuffer = patchMp4Duration(arrayBuffer, durationMs);
    } else {
      patchedBuffer = patchWebmDuration(arrayBuffer, durationMs);
    }

    return new Blob([patchedBuffer], { type: mimeType || blob.type });
  } catch (err) {
    console.warn("[Screen Recorder Pro] Failed to patch media duration metadata:", err);
    return blob;
  }
}
