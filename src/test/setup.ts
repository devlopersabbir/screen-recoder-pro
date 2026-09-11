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
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
    downloads: {
      download: vi.fn((_options: any, callback?: (id: number) => void) => {
        if (typeof callback === "function") {
          callback(123);
        }
        return 123;
      }),
    },
  };
}

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
