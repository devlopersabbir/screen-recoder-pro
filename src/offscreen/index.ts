import Browser from "webextension-polyfill";
import { recorderService } from "../recorder/RecorderService";
import { ExtensionMessage, StateUpdateMessage, ToggleMicMessage } from "../shared/messages";
import { downloadBlob } from "../utils/download";
import { getSettings } from "../utils/settings";
import { createLogger } from "../utils/logger";

const log = createLogger("OffscreenRecorder");

log.info("Offscreen document initialized for persistent recording across page reloads.");

// Listen to recorder state transitions and report back to background
recorderService.onStateChange((state) => {
  log.info(`Offscreen state changed: ${state}`);
  Browser.runtime
    .sendMessage({
      type: "SRP_STATE_UPDATE",
      state,
      durationMs: recorderService.getStartTime() ? Date.now() - recorderService.getStartTime() : 0,
      isPaused: state === "PAUSED",
      startedAt: recorderService.getStartTime() || undefined,
      isMicMuted: recorderService.isMicMuted(),
      hasMic: recorderService.hasMic(),
    } as StateUpdateMessage)
    .catch(() => {});
});

recorderService.onError((err) => {
  log.error("Offscreen recording error:", err);
  Browser.runtime
    .sendMessage({
      type: "SRP_STATE_UPDATE",
      state: "ERROR",
      durationMs: 0,
      isPaused: false,
      error: err.message,
    } as StateUpdateMessage)
    .catch(() => {});
});

recorderService.onComplete(async (result) => {
  log.info("Offscreen recording complete, initiating auto-download.");
  try {
    const settings = await getSettings();
    await downloadBlob(result.blob, result.filename, {
      subfolder: settings.downloadSubfolder,
      saveAs: settings.downloadLocationPrompt,
    });
  } catch (err) {
    log.error("Failed to auto-download recording in offscreen:", err);
  }

  Browser.runtime
    .sendMessage({
      type: "SRP_STATE_UPDATE",
      state: "COMPLETED",
      durationMs: result.durationMs,
      isPaused: false,
      result,
    } as StateUpdateMessage)
    .catch(() => {});
});

// Handle incoming control messages from background or tabs
Browser.runtime.onMessage.addListener(async (rawMsg: unknown) => {
  const message = rawMsg as ExtensionMessage;
  if (!message || typeof message !== "object") return;

  switch (message.type) {
    case "SRP_START_RECORDING": {
      log.info("Offscreen starting recording with options:", message.options);
      await recorderService.startRecording(message.options);
      break;
    }

    case "SRP_STOP_RECORDING": {
      log.info("Offscreen stopping recording.");
      recorderService.stopRecording();
      break;
    }

    case "SRP_PAUSE_RECORDING": {
      log.info("Offscreen pausing recording.");
      recorderService.pauseRecording();
      break;
    }

    case "SRP_RESUME_RECORDING": {
      log.info("Offscreen resuming recording.");
      recorderService.resumeRecording();
      break;
    }

    case "SRP_CANCEL_RECORDING": {
      log.info("Offscreen cancelling recording.");
      recorderService.cancelRecording();
      break;
    }

    case "SRP_TOGGLE_MIC": {
      const toggleMsg = message as ToggleMicMessage;
      const targetMute = typeof toggleMsg.muted === "boolean" ? toggleMsg.muted : !recorderService.isMicMuted();
      recorderService.setMicMuted(targetMute);
      Browser.runtime
        .sendMessage({
          type: "SRP_STATE_UPDATE",
          state: recorderService.getState(),
          durationMs: recorderService.getStartTime() ? Date.now() - recorderService.getStartTime() : 0,
          isPaused: recorderService.getState() === "PAUSED",
          startedAt: recorderService.getStartTime() || undefined,
          isMicMuted: targetMute,
          hasMic: recorderService.hasMic(),
        } as StateUpdateMessage)
        .catch(() => {});
      break;
    }
  }
});
