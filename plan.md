You are a senior Chrome Extension engineer.

Build a production-quality but extremely simple screen recorder browser extension.

## Product

Create a lightweight Chrome/Chromium extension that allows users to record their screen locally.

The primary goal is simplicity, reliability, privacy, and a clean user experience.

## MVP requirements

The extension must support:

1. Start screen recording
2. Chrome's native screen/window/tab selection
3. Optional microphone recording
4. Optional system audio where the browser/OS supports it
5. Pause recording
6. Resume recording
7. Stop recording
8. Recording timer
9. Download the final recording locally
10. Discard/cancel recording
11. Detect when the user manually stops screen sharing
12. Keyboard shortcut for starting recording
13. Clear recording state and error handling

## Explicitly DO NOT build

Do not add:

- Login
- Signup
- Backend
- Database
- Cloud storage
- Payments
- AI processing
- Video editor
- Video hosting
- Team collaboration
- Analytics
- Social features
- Complex settings

The MVP must work completely offline after the extension is installed.

## Technology

Use:

- TypeScript
- React
- Vite
- Chrome Extension Manifest V3
- MediaDevices API
- getDisplayMedia()
- getUserMedia()
- MediaRecorder API
- Chrome Extension APIs only where necessary

Avoid unnecessary dependencies.

## Architecture

Separate the recording logic from the React UI.

Use a dedicated recording service/class responsible for:

- Requesting display media
- Requesting microphone media
- Combining streams when necessary
- Creating MediaRecorder
- Collecting recording chunks
- Pause/resume
- Stop
- Handling stream termination
- Creating the final Blob
- Cleaning up media tracks

The React layer should only manage UI state and communicate with the recording service.

Use a clear recording state machine:

IDLE
REQUESTING_PERMISSION
RECORDING
PAUSED
STOPPING
COMPLETED
ERROR

Avoid scattered boolean flags such as isRecording/isPaused/isStopped.

## Recording format

Use WebM where supported.

Before creating MediaRecorder, check supported MIME types using:

MediaRecorder.isTypeSupported()

Choose the best supported MIME type dynamically instead of blindly hardcoding one.

Prefer a video + audio WebM configuration when supported.

## Screen capture

Use:

navigator.mediaDevices.getDisplayMedia()

The browser must display its native screen-sharing picker.

Never attempt to bypass browser permission or silently capture the user's screen.

The extension must work with:

- Entire screen
- Window
- Browser tab

where supported by the browser.

## Microphone

When microphone recording is enabled, request microphone permission using:

navigator.mediaDevices.getUserMedia({ audio: true })

If microphone permission is denied, show a clear message and allow the user to continue without microphone audio if possible.

Do not make microphone permission mandatory for screen-only recording.

## System audio

Request system audio through display capture where supported.

System-audio support varies by browser, operating system, and selected capture source.

Do not assume system audio is always available.

If system audio is unavailable, gracefully continue without it and clearly communicate the situation to the user.

## Stream termination

This is critical.

If the user clicks the browser's native "Stop sharing" control, the extension must detect that the display video track has ended.

Listen for the relevant MediaStreamTrack termination event and automatically finalize the recording.

The extension must never remain stuck in a "recording" state after the user has stopped sharing.

## Download

When recording finishes:

1. Stop all media tracks
2. Create the final Blob
3. Create an object URL
4. Generate a meaningful filename
5. Trigger a local download
6. Release the object URL
7. Clear temporary recording chunks

Example filename:

screen-recording-YYYY-MM-DD-HH-mm.webm

Do not upload the recording anywhere.

## Privacy

This extension must be local-first.

Recording data must never be sent to:

- A backend
- Analytics
- Third-party APIs
- Cloud storage

No screen content, microphone audio, or recording metadata should leave the user's device.

Request the minimum Chrome permissions necessary.

Do not request unnecessary permissions such as:

- history
- cookies
- tabs
- webRequest
- browsing history

unless technically required and clearly justified.

## UI

Create a minimal modern UI.

Initial popup:

Screen Recorder

Ready to record

Microphone: ON/OFF
System Audio: ON/OFF

[ Start Recording ]

Recording state:

Recording
00:02:31

[ Pause ] [ Stop ]

After completion:

Recording complete

[ Download ]

[ Record Again ]

Keep the interface compact and simple.

Do not create a dashboard.

## Timer

The timer must remain accurate across pause/resume.

Do not simply increment a counter every second without accounting for paused time.

Use timestamps or another reliable elapsed-time calculation.

Format:

00:00:00

## Keyboard shortcut

Add a Chrome extension command for starting recording.

Suggested shortcut:

Ctrl+Shift+R

Mac:

Command+Shift+R

If Chrome imposes restrictions on the requested shortcut, document the limitation instead of implementing an invalid configuration.

## Error handling

Handle at least:

- User cancels screen selection
- Display permission denied
- Microphone permission denied
- System audio unavailable
- MediaRecorder unsupported
- Unsupported MIME type
- Screen sharing manually stopped
- Empty recording
- Recording initialization failure
- Download failure
- Unexpected stream termination

Errors should be understandable to normal users.

Do not expose raw browser stack traces in the UI.

## Project structure

Use a clean structure similar to:

src/
background/
index.ts

popup/
App.tsx
main.tsx
styles.css

recorder/
RecorderService.ts
types.ts

components/
StartButton.tsx
RecordingControls.tsx
Timer.tsx
AudioOptions.tsx

hooks/
useRecorder.ts

utils/
download.ts

public/
icons/

manifest.json
package.json
tsconfig.json
vite.config.ts
README.md

You may adjust the structure if you have a technically better architecture, but keep responsibilities separated and the project easy to maintain.

## Development process

Do NOT generate the entire project blindly in one step.

Build it incrementally.

### Step 1

Create the project structure and Manifest V3 configuration.

Make sure the extension builds and loads successfully in Chrome.

### Step 2

Implement the smallest possible recording flow:

Start
→ native screen picker
→ recording
→ stop
→ local WebM download

Test this before adding other features.

### Step 3

Add microphone support.

### Step 4

Add system-audio support with graceful fallback.

### Step 5

Add pause/resume.

### Step 6

Add accurate timer.

### Step 7

Add recording-state UI and error handling.

### Step 8

Add keyboard shortcut.

### Step 9

Perform production cleanup and testing.

## Testing checklist

Test all of the following:

- Extension installation
- Extension startup
- Start recording
- Entire screen recording
- Window recording
- Browser tab recording
- Microphone enabled
- Microphone disabled
- System audio enabled
- System audio unavailable
- User cancels screen picker
- User denies microphone permission
- Pause
- Resume
- Stop
- Native "Stop sharing"
- Very short recording
- Long recording
- Multiple recordings in sequence
- Downloaded WebM opens correctly
- Recording state resets correctly
- Extension reload
- Browser restart
- macOS
- Windows
- Linux

## Code quality requirements

Use strict TypeScript.

Avoid:

- any
- unnecessary abstractions
- duplicated logic
- global mutable state
- unnecessary dependencies
- console.log debugging left in production

Use proper types and clear naming.

Clean up:

- MediaStream tracks
- MediaRecorder
- Blob URLs
- event listeners
- temporary state

Make the code easy for another engineer to understand.

## Final deliverables

When the implementation is complete, provide:

1. Complete source code
2. package.json
3. manifest.json
4. Vite configuration
5. TypeScript configuration
6. README
7. Build instructions
8. Chrome installation instructions
9. Testing checklist
10. Explanation of browser/OS limitations
11. List of permissions and why each is required

Before considering the project complete, run a production build and verify that the generated extension can be loaded into Chrome without errors.

The most important priorities are:

1. Recording actually works
2. Screen capture is reliable
3. Stop-sharing is handled correctly
4. Audio failures do not break recording
5. Recording stays completely local
6. UI remains extremely simple
7. No unnecessary features are introduced
8. Code is production-quality
