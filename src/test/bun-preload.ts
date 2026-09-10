import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow({ url: "http://localhost" });

// Bind window, document, navigator to globalThis
(globalThis as any).window = window;
(globalThis as any).document = window.document;
(globalThis as any).navigator = window.navigator;

// Copy all DOM classes and properties from window to globalThis
const descriptors = Object.getOwnPropertyDescriptors(window);
for (const [key, descriptor] of Object.entries(descriptors)) {
  if (!(key in globalThis)) {
    try {
      Object.defineProperty(globalThis, key, descriptor);
    } catch {
      // ignore non-configurable properties
    }
  }
}

(globalThis as any).requestAnimationFrame = window.requestAnimationFrame.bind(window);
(globalThis as any).cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => "blob:mock-url";
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = () => {};
}

// @ts-ignore
import { afterEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { vi } from "vitest";

// Extend bun:test expect with jest-dom matchers
expect.extend(matchers);

// Provide afterEach on globalThis for libraries detecting test runner hooks
(globalThis as any).afterEach = afterEach;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (globalThis.document?.body) {
    globalThis.document.body.innerHTML = "";
  }
});

