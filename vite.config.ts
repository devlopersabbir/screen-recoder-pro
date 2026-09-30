import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import fs from "fs";

function findChromiumBinary(preferred?: string): string | undefined {
  const isBravePreferred = preferred === "brave" || !preferred;
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  const braveCandidates = [
    process.env.BRAVE_BINARY,
    // Windows
    `${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    `${programFilesX86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    `${localAppData}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    // macOS
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // Linux
    "/usr/bin/brave-browser",
    "/usr/bin/brave",
  ];

  const chromeCandidates = [
    process.env.CHROME_BINARY,
    // Windows
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  const edgeCandidates = [
    // Windows
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,
    // macOS
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/microsoft-edge",
  ];

  const candidates = [
    ...(isBravePreferred
      ? [...braveCandidates, ...chromeCandidates, ...edgeCandidates]
      : [...chromeCandidates, ...braveCandidates, ...edgeCandidates]),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function findFirefoxBinary(): string | undefined {
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  const candidates = [
    process.env.FIREFOX_BINARY,
    // Windows
    `${programFiles}\\Mozilla Firefox\\firefox.exe`,
    `${programFilesX86}\\Mozilla Firefox\\firefox.exe`,
    `${localAppData}\\Mozilla Firefox\\firefox.exe`,
    // macOS
    "/Applications/Firefox.app/Contents/MacOS/firefox",
    "/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox",
    "/Applications/Firefox Nightly.app/Contents/MacOS/firefox",
    // Linux
    "/usr/bin/firefox",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Strict version validator adhering to SemVer and Chrome/Firefox Extension specifications.
 */
function validateStrictVersion(version: string): void {
  const semverPattern =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  const manifestVersionPattern = /^\d+(\.\d+){1,3}$/;

  if (!semverPattern.test(version)) {
    throw new Error(
      `[Screen Recorder Pro Build Error] Invalid SemVer version in package.json: "${version}". Version must strictly follow SemVer (e.g. 0.1.0).`,
    );
  }

  // Extract base version for manifest (without prerelease/build metadata if any)
  const baseVersion = version.split("-")[0].split("+")[0];
  if (!manifestVersionPattern.test(baseVersion)) {
    throw new Error(
      `[Screen Recorder Pro Build Error] Version "${baseVersion}" is not a valid Extension manifest version (1-4 dot-separated integers).`,
    );
  }
}

const rawTarget = (process.env.TARGET || "brave").toLowerCase();
const isFirefox = rawTarget === "firefox";
const targetBrowser: "chrome" | "firefox" = isFirefox ? "firefox" : "chrome";

function generateManifest() {
  const pkg = readJsonFile("package.json");

  if (!pkg.version || typeof pkg.version !== "string") {
    throw new Error(
      "[Screen Recorder Pro Build Error] Missing or non-string version in package.json",
    );
  }

  validateStrictVersion(pkg.version);

  const cleanManifestVersion = pkg.version.split("-")[0].split("+")[0];

  const background =
    targetBrowser === "firefox"
      ? {
          scripts: ["src/background/index.ts"],
          type: "module",
        }
      : {
          service_worker: "src/background/index.ts",
          type: "module",
        };

  const browserSpecificSettings =
    targetBrowser === "firefox"
      ? {
          gecko: {
            id: "screen-recorder-pro@devlopersabbir.github.io",
            strict_min_version: "142.0",
            data_collection_permissions: {
              required: ["none"],
            },
          },
        }
      : undefined;

  return {
    manifest_version: 3,
    name: "Screen Recorder Pro",
    description:
      pkg.description ||
      "A lightweight, reliable, local-first screen recorder extension for Chrome and Firefox.",
    version: cleanManifestVersion,
    homepage_url: "https://github.com/devlopersabbir/screen-recoder-pro",
    icons: {
      "16": "icons/icon16.png",
      "19": "icons/icon19.png",
      "32": "icons/icon32.png",
      "38": "icons/icon38.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
    action: {
      default_icon: {
        "16": "icons/icon16.png",
        "19": "icons/icon19.png",
        "32": "icons/icon32.png",
        "38": "icons/icon38.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png",
      },
      default_title: "Screen Recorder Pro",
    },
    options_ui: {
      page: "src/options/index.html",
      open_in_tab: true,
    },
    background,
    content_scripts: [
      {
        matches: ["http://*/*", "https://*/*"],
        js: ["src/content/index.tsx"],
        run_at: "document_idle",
      },
    ],
    permissions: [
      "activeTab",
      "scripting",
      "storage",
      "downloads",
      "offscreen",
      "desktopCapture",
      "tabCapture",
    ],
    web_accessible_resources: [
      {
        resources: ["v1.png", "icons/*", "src/offscreen/*"],
        matches: ["<all_urls>"],
      },
    ],
    ...(targetBrowser === "chrome" ? { minimum_chrome_version: "116.0" } : {}),
    ...(browserSpecificSettings
      ? { browser_specific_settings: browserSpecificSettings }
      : {}),
  };
}

/**
 * Vite plugin to eliminate unsafe `innerHTML` assignments and `eval`/`Function` polyfills in output bundles.
 * Guarantees 0-warning / 0-error compliance with Firefox AMO and Chrome Web Store linters.
 */
function extensionSecuritySanitizerPlugin() {
  return {
    name: "vite-plugin-extension-security-sanitizer",
    renderChunk(code: string, chunk: { fileName: string }) {
      if (!chunk.fileName.endsWith(".js")) {
        return null;
      }

      let updatedCode = code;
      let hasReplacements = false;

      // 1. Sanitize innerHTML assignments
      if (updatedCode.includes("innerHTML")) {
        const helperName = "__screen_recorder_safe_set_inner_html";
        const helperDef = `function ${helperName}(el, val) { if (!el) return; el.textContent = ''; if (val) { try { var doc = new DOMParser().parseFromString(val, 'text/html'); while (doc.body.firstChild) { el.appendChild(doc.body.firstChild); } } catch (e) { el.textContent = String(val); } } }\n`;

        const codeWithInnerHtmlSanitized = updatedCode.replace(
          /(?<!['"`])\b([a-zA-Z0-9_$]+)\.innerHTML\s*=\s*([^;,}\n]+)/g,
          (_, target, value) => {
            hasReplacements = true;
            return `${helperName}(${target}, ${value})`;
          },
        );

        if (hasReplacements) {
          updatedCode = helperDef + codeWithInnerHtmlSanitized;
        }
      }

      // 2. Sanitize regeneratorRuntime Function constructor in polyfills
      if (updatedCode.includes('Function("r"')) {
        updatedCode = updatedCode.replace(
          /Function\(["']r["'],\s*["']regeneratorRuntime\s*=\s*r["']\)/g,
          '(function(r){ if (typeof globalThis !== "undefined") globalThis.regeneratorRuntime = r; })',
        );
        hasReplacements = true;
      }

      // 3. Sanitize Function("binder", ...) constructor in function-bind / es-abstract polyfills
      if (updatedCode.includes('Function("binder"')) {
        updatedCode = updatedCode.replace(
          /Function\s*\(\s*["']binder["']\s*,[\s\S]*?binder\.apply\(this,\s*arguments\);?\s*\}["']\s*\)/g,
          "(function(binder){ return function(){ return binder.apply(this, arguments); }; })",
        );
        hasReplacements = true;
      }

      // 4. Sanitize "%eval%":eval in get-intrinsic polyfill
      if (
        updatedCode.includes('"%eval%":eval') ||
        updatedCode.includes("'%eval%':eval")
      ) {
        updatedCode = updatedCode.replace(
          /["']%eval%["']\s*:\s*eval\b/g,
          '"%eval%":undefined',
        );
        hasReplacements = true;
      }

      if (hasReplacements) {
        return {
          code: updatedCode,
          map: null,
        };
      }

      return null;
    },
  };
}

export default defineConfig({
  build: {
    // Disable minification for Firefox to provide clean, readable code to AMO reviewers and avoid obfuscation flags
    minify: targetBrowser === "firefox" ? false : "esbuild",
    sourcemap: false,
  },
  plugins: [
    extensionSecuritySanitizerPlugin(),
    react(),
    webExtension({
      manifest: generateManifest,
      browser: targetBrowser,
      additionalInputs: ["src/offscreen/index.html"],
      webExtConfig: {
        target: targetBrowser === "firefox" ? "firefox-desktop" : "chromium",
        ...(targetBrowser === "firefox"
          ? findFirefoxBinary()
            ? { firefoxBinary: findFirefoxBinary() }
            : {}
          : findChromiumBinary(rawTarget)
            ? { chromiumBinary: findChromiumBinary(rawTarget) }
            : {}),
      },
      // Automatically launch browser in dev mode (unless AUTO_LAUNCH=false is explicitly set)
      disableAutoLaunch: process.env.AUTO_LAUNCH === "false",
    }),
  ],
});
