import Browser from "webextension-polyfill";
import { createLogger } from "../utils/logger";
import { APP_NAME, APP_VERSION } from "../shared/constants";

const log = createLogger("Background");

Browser.runtime.onInstalled.addListener((details) => {
  log.info(`${APP_NAME} (v${APP_VERSION}) background worker initialized.`, {
    reason: details.reason,
  });
});
