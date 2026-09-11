import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

if (typeof globalThis !== "undefined" && !(globalThis as any).chrome) {
  (globalThis as any).chrome = {
    runtime: {
      id: "screen-recorder-pro-mock-extension-id",
      sendMessage: vi.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn().mockResolvedValue(undefined),
    },
  };
}

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
