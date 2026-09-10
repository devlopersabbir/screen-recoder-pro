import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
