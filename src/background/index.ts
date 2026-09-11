import Browser from "webextension-polyfill";
import { createLogger } from "../utils/logger";
import { APP_NAME, APP_VERSION } from "../shared/constants";
import { ExtensionMessage, StateUpdateMessage } from "../shared/messages";
import { RecordingState } from "../recorder/types";

const log = createLogger("Background");

let currentSession: {
  state: RecordingState;
  startedAt?: number;
  isPaused: boolean;
} = {
  state: "IDLE",
  isPaused: false,
};

async function broadcastToTabs(message: ExtensionMessage): Promise<void> {
  try {
    const tabs = await Browser.tabs.query({});
    for (const tab of tabs) {
      if (typeof tab.id === "number") {
        Browser.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab might not support content scripts (e.g., chrome://)
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

// When user clicks the extension toolbar icon, open the options page
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

Browser.runtime.onMessage.addListener(async (rawMsg: unknown) => {
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
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      } as StateUpdateMessage;
    }

    case "SRP_STATE_UPDATE": {
      const updateMsg = message as StateUpdateMessage;
      currentSession.state = updateMsg.state;
      currentSession.isPaused = updateMsg.isPaused;
      if (updateMsg.startedAt) {
        currentSession.startedAt = updateMsg.startedAt;
      }
      await broadcastToTabs(updateMsg);
      break;
    }

    case "SRP_STOP_RECORDING": {
      currentSession.state = "STOPPING";
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "STOPPING",
        isPaused: false,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });
      break;
    }

    case "SRP_PAUSE_RECORDING": {
      currentSession.state = "PAUSED";
      currentSession.isPaused = true;
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "PAUSED",
        isPaused: true,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });
      break;
    }

    case "SRP_RESUME_RECORDING": {
      currentSession.state = "RECORDING";
      currentSession.isPaused = false;
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "RECORDING",
        isPaused: false,
        durationMs: currentSession.startedAt ? Date.now() - currentSession.startedAt : 0,
      });
      break;
    }

    case "SRP_CANCEL_RECORDING": {
      currentSession = { state: "IDLE", isPaused: false };
      await broadcastToTabs({
        type: "SRP_STATE_UPDATE",
        state: "IDLE",
        isPaused: false,
        durationMs: 0,
      });
      break;
    }
  }
});

