import { describe, it, expect } from "vitest";
import { patchMp4Duration, patchWebmDuration, fixMediaDuration } from "./mediaFixer";

describe("mediaFixer", () => {
  it("should patch duration in an MP4 mvhd and tkhd box", () => {
    // Construct a synthetic MP4 box structure with moov -> mvhd and moov -> trak -> tkhd
    // moov size: 8 + 32 (mvhd) + (8 + 32 (tkhd)) = 80 bytes
    const buffer = new ArrayBuffer(80);
    const view = new DataView(buffer);

    // Box 1: moov
    view.setUint32(0, 80); // size
    view.setUint8(4, 0x6d); // 'm'
    view.setUint8(5, 0x6f); // 'o'
    view.setUint8(6, 0x6f); // 'o'
    view.setUint8(7, 0x76); // 'v'

    // Box 2: mvhd (inside moov, offset 8)
    view.setUint32(8, 32); // size
    view.setUint8(12, 0x6d); // 'm'
    view.setUint8(13, 0x76); // 'v'
    view.setUint8(14, 0x68); // 'h'
    view.setUint8(15, 0x64); // 'd'
    view.setUint8(16, 0); // version 0
    view.setUint32(28, 1000); // timescale = 1000 (offset 8 + 8 + 12 = 28)
    view.setUint32(32, 0); // duration = 0 (offset 8 + 8 + 16 = 32)

    // Box 3: trak (inside moov, offset 40)
    view.setUint32(40, 40); // size
    view.setUint8(44, 0x74); // 't'
    view.setUint8(45, 0x72); // 'r'
    view.setUint8(46, 0x61); // 'a'
    view.setUint8(47, 0x6b); // 'k'

    // Box 4: tkhd (inside trak, offset 48)
    view.setUint32(48, 32); // size
    view.setUint8(52, 0x74); // 't'
    view.setUint8(53, 0x6b); // 'k'
    view.setUint8(54, 0x68); // 'h'
    view.setUint8(55, 0x64); // 'd'
    view.setUint8(56, 0); // version 0
    view.setUint32(76, 0); // duration = 0 (offset 48 + 8 + 20 = 76)

    // Patch duration for 5000ms (5 seconds -> 5000 units at 1000 timescale)
    patchMp4Duration(buffer, 5000);

    expect(view.getUint32(32)).toBe(5000);
    expect(view.getUint32(76)).toBe(5000);
  });

  it("should patch WebM duration float in EBML Segment Info", () => {
    // Construct synthetic WebM buffer with EBML 0x4489 + len 0x84 + 4-byte float32
    const buffer = new ArrayBuffer(16);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    bytes[0] = 0x44;
    bytes[1] = 0x89;
    bytes[2] = 0x84; // 4-byte float
    view.setFloat32(3, 0);

    patchWebmDuration(buffer, 12500);

    expect(view.getFloat32(3)).toBeCloseTo(12500);
  });

  it("should fix Media duration via fixMediaDuration on a Blob", async () => {
    const buffer = new ArrayBuffer(40);
    const view = new DataView(buffer);
    view.setUint32(0, 40);
    view.setUint8(4, 0x6d); // 'm'
    view.setUint8(5, 0x6f); // 'o'
    view.setUint8(6, 0x6f); // 'o'
    view.setUint8(7, 0x76); // 'v'
    view.setUint32(8, 32);
    view.setUint8(12, 0x6d);
    view.setUint8(13, 0x76);
    view.setUint8(14, 0x68);
    view.setUint8(15, 0x64);
    view.setUint8(16, 0); // version 0
    view.setUint32(28, 1000);
    view.setUint32(32, 0);

    const initialBlob = new Blob([buffer], { type: "video/mp4" });
    const fixedBlob = await fixMediaDuration(initialBlob, 8000, "video/mp4");

    const resultBuffer = await fixedBlob.arrayBuffer();
    const resultView = new DataView(resultBuffer);
    expect(resultView.getUint32(32)).toBe(8000);
  });
});
