## [1.2.1](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.2.0...v1.2.1) (2026-09-11)

# [1.2.0](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.1.3...v1.2.0) (2026-09-11)


### Features

* add asset generation scripts and updated branding icons and screenshots ([3fb268b](https://github.com/devlopersabbir/screen-recoder-pro/commit/3fb268b91e319ac90c159cc2a38eff85fdd9d38f))

## [1.1.3](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.1.2...v1.1.3) (2026-09-11)


### Bug Fixes

* **deploy:** add amo-metadata with categories and summary for firefox ([43b3e17](https://github.com/devlopersabbir/screen-recoder-pro/commit/43b3e17c28d3f272f193c771d309b68eaaa58a62))

## [1.1.2](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.1.1...v1.1.2) (2026-09-11)


### Bug Fixes

* implement floating widget UI, options page, and recorder service with Firefox deployment pipeline ([3142c3b](https://github.com/devlopersabbir/screen-recoder-pro/commit/3142c3bd23baeb88d29bab315926f0759c87c2f4))

## [1.1.1](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.1.0...v1.1.1) (2026-09-11)


### Bug Fixes

* configure background script entry point for Firefox compatibility ([93d88ce](https://github.com/devlopersabbir/screen-recoder-pro/commit/93d88ce78fbcca2623839f8ba47748b1e24baff1))

# [1.1.0](https://github.com/devlopersabbir/screen-recoder-pro/compare/v1.0.0...v1.1.0) (2026-09-11)


### Features

* implement core screen recording functionality with background service, content widget, and settings UI ([990f3ca](https://github.com/devlopersabbir/screen-recoder-pro/commit/990f3ca6a39d416b8fb338ad4cb5bfd2f47f0d8e))
* implement core screen recording functionality with floating widget and service layer ([61b052b](https://github.com/devlopersabbir/screen-recoder-pro/commit/61b052b0f7e96d65c7556dfd0f939679a2ed0c7d))
* implement recording service, download utilities, and options page UI with device management ([e9f92a9](https://github.com/devlopersabbir/screen-recoder-pro/commit/e9f92a9bbaac3d81bfaf7b6badc57263a137258a))

# 1.0.0 (2026-09-10)


### Features

* initial project setup ([1164d32](https://github.com/devlopersabbir/screen-recoder-pro/commit/1164d3259341244c4d5bac5f48d282e5f5e2d8bb))

# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.0.1](https://github.com/devlopersabbir/screen-recoder-pro/releases/tag/v0.0.1) (2026-09-10)

### Features

* **core:** initial screen recorder architecture with state machine (`IDLE`, `REQUESTING_PERMISSION`, `RECORDING`, `STOPPING`, `COMPLETED`, `ERROR`)
* **capture:** native display capture support via `navigator.mediaDevices.getDisplayMedia`
* **capture:** automatic detection of browser native "Stop sharing" event
* **recorder:** dynamic WebM MIME type detection (`video/webm;codecs=vp9,opus`, etc.)
* **download:** local download utility with timestamped filename generation (`screen-recording-YYYY-MM-DD-HH-mm.webm`)
* **ui:** compact modern extension popup UI with dark theme
* **ci:** automated GitHub Actions CI pipeline, multi-target packaging (`zip.ts`), and Semantic Release
