import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow({ url: "http://localhost" });

Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLAnchorElement: window.HTMLAnchorElement,
  DOMException: window.DOMException,
  Node: window.Node,
  Element: window.Element,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  MouseEvent: window.MouseEvent,
  KeyboardEvent: window.KeyboardEvent,
  MutationObserver: window.MutationObserver,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => "blob:mock-url";
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = () => {};
}

import "@testing-library/jest-dom";
