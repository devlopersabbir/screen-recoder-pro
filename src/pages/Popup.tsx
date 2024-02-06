import Browser from "webextension-polyfill";
import "./Popup.css";
import { useEffect } from "react";

export default function () {
  // inject the current script into the current page
  useEffect(() => {
    const init = async () => {
      const tabs = await Browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs[0].id) return;
      const tabId = tabs[0].id;
      await Browser.tabs.sendMessage(tabId, { active: true });
    };

    init();
  }, []);
  return (
    <>
      <h1>hello</h1>
    </>
  );
}
