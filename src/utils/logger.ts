import { APP_NAME, APP_VERSION } from "../shared/constants";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
}

export interface DiagnosticReport {
  app: string;
  version: string;
  timestamp: string;
  userAgent: string;
  logCount: number;
  logs: LogEntry[];
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class LoggerRegistry {
  private maxHistory: number = 500;
  private history: LogEntry[] = [];
  private minLevel: LogLevel = "DEBUG";
  private isEnabled: boolean = true;

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setMaxHistory(limit: number): void {
    this.maxHistory = limit;
  }

  public addEntry(entry: LogEntry): void {
    if (!this.isEnabled) return;

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[this.minLevel]) {
      this.writeToConsole(entry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.split("T")[1].slice(0, 8)}] [${entry.level}] [${entry.scope}]:`;
    const args = entry.data !== undefined ? [prefix, entry.message, entry.data] : [prefix, entry.message];

    switch (entry.level) {
      case "DEBUG":
        console.debug(...args);
        break;
      case "INFO":
        console.info(...args);
        break;
      case "WARN":
        console.warn(...args);
        break;
      case "ERROR":
        console.error(...args);
        break;
    }
  }

  public getHistory(): LogEntry[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  public generateDiagnosticReport(): DiagnosticReport {
    return {
      app: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
      logCount: this.history.length,
      logs: this.getHistory(),
    };
  }

  public exportLogsAsJson(): string {
    return JSON.stringify(this.generateDiagnosticReport(), null, 2);
  }

  public exportLogsAsText(): string {
    return this.history
      .map((l) => {
        const dataStr = l.data !== undefined ? ` | data: ${JSON.stringify(l.data)}` : "";
        return `${l.timestamp} [${l.level.padEnd(5)}] [${l.scope}]: ${l.message}${dataStr}`;
      })
      .join("\n");
  }
}

export const loggerRegistry = new LoggerRegistry();

export class ScopedLogger {
  constructor(private scope: string) {}

  public debug(message: string, data?: unknown): void {
    this.log("DEBUG", message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log("INFO", message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log("WARN", message, data);
  }

  public error(message: string, data?: unknown): void {
    this.log("ERROR", message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    loggerRegistry.addEntry({
      timestamp: new Date().toISOString(),
      level,
      scope: this.scope,
      message,
      data,
    });
  }
}

export function createLogger(scope: string): ScopedLogger {
  return new ScopedLogger(scope);
}
