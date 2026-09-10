import Browser from "webextension-polyfill";

console.log("Hello from the background!");

Browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

Browser.runtime.onMessage.addListener((active: any) => {
  if (active) {
    Browser.runtime.sendMessage({ active });
  }
});
