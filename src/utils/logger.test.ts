import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, loggerRegistry } from "./logger";

describe("Enterprise Structured Logger", () => {
  beforeEach(() => {
    loggerRegistry.clearHistory();
    loggerRegistry.setMinLevel("DEBUG");
    loggerRegistry.setEnabled(true);
  });

  afterEach(() => {
    loggerRegistry.clearHistory();
    vi.restoreAllMocks();
  });

  it("should record log entries with timestamps, levels, scopes, and messages", () => {
    const log = createLogger("TestScope");
    log.info("Test info message", { key: "val" });

    const history = loggerRegistry.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].scope).toBe("TestScope");
    expect(history[0].level).toBe("INFO");
    expect(history[0].message).toBe("Test info message");
    expect(history[0].data).toEqual({ key: "val" });
    expect(history[0].timestamp).toBeDefined();
  });

  it("should support all log levels (DEBUG, INFO, WARN, ERROR)", () => {
    const log = createLogger("MultiLevel");
    log.debug("Debug msg");
    log.info("Info msg");
    log.warn("Warn msg");
    log.error("Error msg");

    const history = loggerRegistry.getHistory();
    expect(history.length).toBe(4);
    expect(history.map((h) => h.level)).toEqual(["DEBUG", "INFO", "WARN", "ERROR"]);
  });

  it("should respect minLevel filtering for console output", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    loggerRegistry.setMinLevel("INFO");
    const log = createLogger("FilterScope");

    log.debug("Should be suppressed on console");
    expect(debugSpy).not.toHaveBeenCalled();

    log.info("Should be printed on console");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("should limit in-memory circular buffer to maxHistory", () => {
    loggerRegistry.setMaxHistory(3);
    const log = createLogger("BufferScope");

    log.info("msg 1");
    log.info("msg 2");
    log.info("msg 3");
    log.info("msg 4");

    const history = loggerRegistry.getHistory();
    expect(history.length).toBe(3);
    expect(history.map((h) => h.message)).toEqual(["msg 2", "msg 3", "msg 4"]);
  });

  it("should export diagnostic report as JSON and text", () => {
    const log = createLogger("ExportScope");
    log.info("Operation started");
    log.error("Failed unexpectedly", { reason: "Network" });

    const report = loggerRegistry.generateDiagnosticReport();
    expect(report.logCount).toBe(2);
    expect(report.logs.length).toBe(2);
    expect(report.version).toBeDefined();

    const jsonStr = loggerRegistry.exportLogsAsJson();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.logCount).toBe(2);

    const textStr = loggerRegistry.exportLogsAsText();
    expect(textStr).toContain("[INFO ] [ExportScope]: Operation started");
    expect(textStr).toContain("[ERROR] [ExportScope]: Failed unexpectedly");
  });
});
