# Security Policy

The Screen Recorder Pro team takes user privacy and security with the highest level of seriousness. Because this extension deals directly with screen capture and recording media, we adhere to a strict local-first, zero-telemetry architectural principle.

---

## 🛡️ Supported Versions

We actively support the latest version of Screen Recorder Pro with security fixes and patches.

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **0.x.x** | ✅ Supported | Active MVP development |

---

## 🔒 Security Principles

Screen Recorder Pro is built upon the following strict security guarantees:

1. **100% Local Execution**: All screen capture, media encoding, and download operations occur strictly within the client browser. No video, audio, or metadata ever leaves your device.
2. **Zero Remote Transmission**: No analytics, tracking scripts, backend APIs, or remote telemetry exist in this codebase.
3. **No Unsafe Code Evaluation**: Prohibits `eval()`, `new Function()`, and remote scripts, fully adhering to Chrome Web Store and Mozilla AMO security guidelines.
4. **Least Privilege**: Only uses the absolute minimum permissions strictly necessary to execute its feature set.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Screen Recorder Pro, **please do not report it through public GitHub issues or discussions.**

Instead, report vulnerabilities responsibly through one of the following private channels:

1. **GitHub Private Security Advisory (Preferred)**:  
   Navigate to the [Security Advisories](https://github.com/devlopersabbir/screen-recoder-pro/security/advisories) page of this repository and click **"Report a vulnerability"**.

2. **Direct Security Email**:  
   Send an email to **[devlopersabbir@gmail.com](mailto:devlopersabbir@gmail.com)** with the subject prefix `[SECURITY] Screen Recorder Pro`.

### What to Include in Your Report

To help us investigate and remediate the issue promptly, please include:
- A description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept (PoC) to reproduce the behavior.
- Affected browser(s) (e.g. Chrome, Firefox, Brave) and operating system.
- Any suggested fixes or mitigations if known.

---

## ⏱️ Response & Disclosure Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within **48 hours**.
- **Assessment & Triage**: We will investigate and validate the report within **5 business days**.
- **Fix & Disclosure**: Critical vulnerabilities will be patched promptly and released via GitHub and extension store updates. We request that you observe responsible disclosure guidelines until a patch is published.
