import Browser from "webextension-polyfill";
import { createLogger } from "../utils/logger";
import { APP_NAME, APP_VERSION } from "../shared/constants";
import { ExtensionMessage, StartRecordingMessage, StateUpdateMessage, ToggleMicMessage } from "../shared/messages";
import { RecordingResult, RecordingState } from "../recorder/types";

declare const chrome: any;

const log = createLogger("Background");

interface SessionState {
  state: RecordingState;
  startedAt?: number;
  isPaused: boolean;
  isMicMuted?: boolean;
  hasMic?: boolean;
  result?: RecordingResult;
  error?: string;
}

let currentSession: SessionState = {
  state: "IDLE",
  isPaused: false,
};

const SESSION_STORAGE_KEY = "srp_active_session";

async function saveSession(): Promise<void> {
  try {
    const storage = Browser.storage.session || Browser.storage.local;
    if (storage?.set) {
      await storage.set({ [SESSION_STORAGE_KEY]: currentSession });
    }
  } catch {
    // ignore
  }
}

async function loadSession(): Promise<void> {
  try {
    const storage = Browser.storage.session || Browser.storage.local;
    if (storage?.get) {
      const data = await storage.get(SESSION_STORAGE_KEY);
      if (data && data[SESSION_STORAGE_KEY]) {
        currentSession = { ...currentSession, ...data[SESSION_STORAGE_KEY] };
      }
    }
  } catch {
    // ignore
  }
}

// Restore saved session on background service worker wake-up
loadSession().catch(() => {});

async function hasOffscreenDocument(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.runtime?.getContexts) {
    return false;
  }
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT" as any],
    });
    return contexts.length > 0;
  } catch {
    return false;
  }
}

async function ensureOffscreenDocument(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.offscreen) {
    return;
  }
  const exists = await hasOffscreenDocument();
  if (exists) return;

  try {
    await chrome.offscreen.createDocument({
      url: "src/offscreen/index.html",
      reasons: [chrome.offscreen.Reason.DISPLAY_MEDIA],
      justification: "Persistent screen and microphone recording across page reloads and tab navigations",
    });
    log.info("Offscreen recording document launched successfully.");
  } catch (err) {
    log.warn("Failed to create offscreen document:", err);
  }
}

async function closeOffscreenDocument(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.offscreen) {
    return;
  }
  try {
    const exists = await hasOffscreenDocument();
    if (exists) {
      await chrome.offscreen.closeDocument();
      log.info("Offscreen recording document closed cleanly.");
    }
  } catch (err) {
    log.warn("Failed to close offscreen document:", err);
  }
}

async function broadcastToTabs(message: ExtensionMessage): Promise<void> {
  try {
    const tabs = await Browser.tabs.query({});
    for (const tab of tabs) {
      if (typeof tab.id === "number") {
        Browser.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab might not support content scripts (e.g. chrome://)
        });
      }
    }
  } catch (err) {
    log.warn("Failed to broadcast message to tabs", err);
  }
}

Browser.runtime.onInstalled.addListener(async (details) => {
  log.info(`${APP_NAME} (v${APP_VERSION}) background worker initialized.`, {
    reason: details.reason,
  });

  // Inject into any existing tabs so user doesn't need manual refresh
  try {
    const tabs = await Browser.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      if (typeof tab.id === "number" && (Browser as any).scripting?.executeScript) {
        (Browser as any).scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["src/content/index.js"],
          })
          .catch(() => {});
      }
    }
  } catch {
    // ignore
  }
});

// When user clicks the extension toolbar icon, open options page
const actionApi = Browser.action || (Browser as any).browserAction;
if (actionApi?.onClicked) {
  actionApi.onClicked.addListener(async () => {
    try {
      await Browser.runtime.openOptionsPage();
    } catch {
      const url = Browser.runtime.getURL("src/options/index.html");
      Browser.tabs.create({ url }).catch(() => {});
    }
  });
}

Browser.runtime.onMessage.addListener(async (rawMsg: unknown, sender: any) => {
  const message = rawMsg as ExtensionMessage;
  if (!message || typeof message !== "object") return;

  log.info(`Background received message: [${message.type}]`);

  switch (message.type) {
    case "SRP_GET_STATE": {
      return {
        type: "SRP_STATE_UPDATE",
        state: currentSession.state,
        startedAt: currentSession.startedAt,
        isPaused: currentSession.isPaused,
        isMicMuted: currentSession.isMicMuted,
        hasMic: currentSession.hasMic,
        result: currentSession.result,
        error: currentSession.error,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      } as StateUpdateMessage;
    }

    case "SRP_START_RECORDING": {
      const startMsg = message as StartRecordingMessage;
      const targetTab = sender?.tab;

      // When running in Chrome with desktopCapture and offscreen support:
      // Use chooseDesktopMedia to show native screen sharing picker and streamId
      if (
        typeof chrome !== "undefined" &&
        chrome.desktopCapture?.chooseDesktopMedia &&
        targetTab &&
        chrome.offscreen
      ) {
        currentSession.state = "REQUESTING_PERMISSION";
        await saveSession();
        await broadcastToTabs({
          type: "SRP_STATE_UPDATE",
          state: "REQUESTING_PERMISSION",
          isPaused: false,
          durationMs: 0,
        });

        chrome.desktopCapture.chooseDesktopMedia(
          ["screen", "window", "tab", "audio"],
          targetTab,
          async (streamId: string | null) => {
            if (!streamId) {
              log.info("User cancelled desktop capture dialog");
              currentSession = { state: "IDLE", isPaused: false };
              await saveSession();
              await broadcastToTabs({
                type: "SRP_STATE_UPDATE",
                state: "IDLE",
                isPaused: false,
                durationMs: 0,
              });
              return;
            }

            await ensureOffscreenDocument();
            // Forward to offscreen with streamId so recording runs in persistent background
            Browser.runtime
              .sendMessage({
                type: "SRP_START_RECORDING",
                options: {
                  ...startMsg.options,
                  streamId,
                },
              })
              .catch(() => {});
          }
        );
      } else {
        // Fallback: create offscreen document or forward directly
        await ensureOffscreenDocument();
        Browser.runtime.sendMessage(startMsg).catch(() => {});
      }
      break;
    }

    case "SRP_STATE_UPDATE": {
      const updateMsg = message as StateUpdateMessage;
      currentSession.state = updateMsg.state;
      currentSession.isPaused = updateMsg.isPaused;
      if (updateMsg.startedAt) {
        currentSession.startedAt = updateMsg.startedAt;
      }
      if (typeof updateMsg.isMicMuted === "boolean") {
        currentSession.isMicMuted = updateMsg.isMicMuted;
      }
      if (typeof updateMsg.hasMic === "boolean") {
        currentSession.hasMic = updateMsg.hasMic;
      }
      if (updateMsg.result) {
        currentSession.result = updateMsg.result;
      }
      if (updateMsg.error) {
        currentSession.error = updateMsg.error;
      }

      await saveSession();
      await broadcastToTabs(updateMsg);

      if (updateMsg.state === "COMPLETED" || updateMsg.state === "IDLE" || updateMsg.state === "ERROR") {
        // Delay closing offscreen document slightly so downloads and completion settle
        setTimeout(() => {
          closeOffscreenDocument().catch(() => {});
        }, 1000);
      }
      break;
    }

    case "SRP_STOP_RECORDING": {
      currentSession.state = "STOPPING";
      await saveSession();
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "STOPPING",
        isPaused: false,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });

      // Signal offscreen document or active recorder
      Browser.runtime.sendMessage(message).catch(() => {});
      break;
    }

    case "SRP_PAUSE_RECORDING": {
      currentSession.state = "PAUSED";
      currentSession.isPaused = true;
      await saveSession();
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "PAUSED",
        isPaused: true,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });

      Browser.runtime.sendMessage(message).catch(() => {});
      break;
    }

    case "SRP_RESUME_RECORDING": {
      currentSession.state = "RECORDING";
      currentSession.isPaused = false;
      await saveSession();
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "RECORDING",
        isPaused: false,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });

      Browser.runtime.sendMessage(message).catch(() => {});
      break;
    }

    case "SRP_CANCEL_RECORDING": {
      currentSession = { state: "IDLE", isPaused: false };
      await saveSession();
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "IDLE",
        isPaused: false,
        durationMs: 0,
      });

      Browser.runtime.sendMessage(message).catch(() => {});
      await closeOffscreenDocument();
      break;
    }

    case "SRP_TOGGLE_MIC": {
      // Forward mic muting toggle to offscreen or active recorder
      const toggleMsg = message as ToggleMicMessage;
      if (typeof toggleMsg.muted === "boolean") {
        currentSession.isMicMuted = toggleMsg.muted;
      } else {
        currentSession.isMicMuted = !currentSession.isMicMuted;
      }
      await saveSession();
      Browser.runtime.sendMessage(message).catch(() => {});
      break;
    }
  }
});
