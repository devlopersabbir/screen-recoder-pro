import Browser from "webextension-polyfill";

Browser.runtime.onMessage.addListener((active) => {
  if (active) {
    const cameraId = "";
    const camera = document.getElementById(cameraId);

    // check if camera exists
    if (camera) {
      console.log("camera found!");
    } else {
      const cameraElement = document.createElement("div");
      cameraElement.id = cameraId;
      cameraElement.setAttribute(
        "style",
        `
      position: fixed;
      width: 200px;
      height: 200px;
      border-radius: 100%;
      z-index: 999999999;
      background: black;
      `
      );
      document.body.appendChild(cameraElement);
    }
  }
});
