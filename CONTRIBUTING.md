# Contributing to Screen Recorder Pro

Thank you for your interest in contributing to Screen Recorder Pro! 🎉

Screen Recorder Pro is an open-source, local-first browser extension designed for privacy, simplicity, and rock-solid reliability.

---

## 📜 Code of Conduct

Everyone participating in this project is expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to [devlopersabbir@gmail.com](mailto:devlopersabbir@gmail.com).

---

## 🚀 Getting Started

### Prerequisites

- **[Bun](https://bun.sh/)** v1.1.0+ *(Recommended)* or **[Node.js](https://nodejs.org/)** v20+
- **Git**
- Any Chromium browser (Chrome, Brave, Edge, Arc) or Firefox for extension testing

### Setup Repository

```bash
# 1. Clone your fork
git clone https://github.com/devlopersabbir/screen-recoder-pro.git
cd screen-recoder-pro

# 2. Install dependencies
bun install
# or: npm install

# 3. Start local development server
bun dev
# or: npm run dev
```

### Loading Extension into Chrome / Brave / Edge

1. Open `chrome://extensions/` (or `brave://extensions/`).
2. Toggle on **Developer mode** in the upper right corner.
3. Click **Load unpacked** and select the `dist/` directory.

### Loading Extension into Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select `dist/manifest.json`.

---

## 🧪 Testing Guidelines

We enforce a strict 0-issue, high-reliability test policy. **Every PR must maintain 100% passing tests.**

```bash
# Run unit & integration test suite
bun test
# or: npm test
```

---

## 📦 Building & Packaging

```bash
# Build for Chrome (Manifest V3 service worker)
bun run build:chrome

# Build for Firefox (Manifest V3 background scripts & Gecko ID)
bun run build:firefox

# Package release zip archives
bun run zip:all
```

---

## 📝 Commit Convention (Mandatory)

We enforce **Conventional Commits** via automated PR title linting and Semantic Release.

### Format:
```
<type>(<optional scope>): <description>
```

### Allowed Types:
- `feat:` A new user-facing feature (triggers minor version bump, e.g. `0.1.0`)
- `fix:` A bug fix (triggers patch bump, e.g. `0.0.2`)
- `perf:` Performance improvement (triggers patch bump)
- `refactor:` Code change that neither fixes a bug nor adds a feature (patch bump)
- `docs:` Documentation changes (patch bump)
- `style:` Formatting changes with no code logic impact (patch bump)
- `test:` Adding or refactoring tests
- `chore:` Maintenance, dependency updates, or build tooling changes (patch bump)

### Examples:
- `feat(recorder): add system audio capture support`
- `fix(popup): correct button label in completed state`
- `docs: update build instructions in README`
- `feat!: migrate to Manifest V4 architecture` (triggers major bump)

---

## 🔄 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Write clean, typed TypeScript code. Avoid `any` types.
3. Add comprehensive tests for any new logic or bug fixes.
4. Verify tests and build pass cleanly:
   ```bash
   bun test
   bun run build:chrome
   bun run build:firefox
   ```
5. Commit with a Conventional Commit message.
6. Push to your fork and submit a PR against `main`. Ensure the PR title adheres to the Conventional Commits format.
