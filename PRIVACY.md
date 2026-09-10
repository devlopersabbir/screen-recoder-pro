# Privacy Policy for Screen Recorder Pro

**Last Updated:** September 2026

**Screen Recorder Pro** ("we", "our", or "the extension") is a lightweight, local-first browser extension designed to record your screen, window, or browser tabs securely.

Screen Recorder Pro operates under a strict **Zero-Data-Collection Policy**. We believe your screen activity and microphone audio are strictly private to you.

---

## 1. Information We Do NOT Collect

* **No Screen Capture Uploads:** Screen capture frames and audio streams are processed entirely in-memory on your device using native Web APIs (`getDisplayMedia`, `MediaRecorder`). Recordings are saved directly to your local file system via standard browser downloads. Nothing is uploaded to any server or cloud storage.
* **No Personally Identifiable Information (PII):** We do not request, collect, or store names, email addresses, IP addresses, locations, or account credentials.
* **No Browsing History or Tab Data:** The extension cannot see or inspect your browsing history, visited URLs, cookies, or tab contents.
* **No Analytics or Telemetry:** There are no analytics libraries (e.g. Google Analytics, Mixpanel, Sentry) or tracking beacons embedded in this extension.
* **No Third-Party Advertising:** The extension is 100% free of advertisements, trackers, and monetization SDKs.

---

## 2. Permissions & Media Device Access

Screen Recorder Pro requests only the minimal browser capabilities technically required:

* **Screen Capture (`navigator.mediaDevices.getDisplayMedia`):** Prompts the native browser display-selection dialog. Capture begins only when you explicitly select a screen, window, or tab and confirm. You can terminate sharing at any moment using the browser's native "Stop sharing" control.
* **Microphone Access (`navigator.mediaDevices.getUserMedia`):** Only requested when you explicitly enable microphone recording. The audio stream is combined locally with your video stream and is never sent over any network interface.

---

## 3. Offline Functionality

Screen Recorder Pro is fully functional offline. After installation, the extension requires no active internet connection to start, record, pause, resume, stop, or download recordings.

---

## 4. Changes to This Policy

Any future revisions to this Privacy Policy will be documented with an updated timestamp and detailed in the project's [CHANGELOG.md](CHANGELOG.md).

---

## 5. Contact

If you have questions or concerns regarding this privacy policy, please contact:
- **Maintainer:** Sabbir Hossain Shuvo
- **Email:** [devlopersabbir@gmail.com](mailto:devlopersabbir@gmail.com)
- **Repository:** [https://github.com/devlopersabbir/screen-recoder-pro](https://github.com/devlopersabbir/screen-recoder-pro)
