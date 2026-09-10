import React from "react";
import { useRecorder } from "../hooks/useRecorder";
import { StartButton } from "../components/StartButton";
import { RecordingControls } from "../components/RecordingControls";
import "./styles.css";

export const App: React.FC = () => {
  const {
    state,
    result,
    error,
    startRecording,
    stopRecording,
    downloadRecording,
    resetRecording,
  } = useRecorder();

  const handleStart = () => {
    startRecording();
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="brand">
          <div className="brand-icon" />
          <span className="brand-title">Screen Recorder</span>
        </div>
        <span className="version-badge">v0.0.1</span>
      </header>

      <main className="content-body">
        {error && (
          <div className="error-card">
            <strong>Notice:</strong> {error.message}
          </div>
        )}

        {state === "IDLE" && (
          <>
            <div className="status-card">
              <span className="status-label">Ready to record</span>
              <span className="status-subtext">
                Record your entire screen, a window, or a specific browser tab locally.
              </span>
            </div>
            <StartButton onClick={handleStart} />
          </>
        )}

        {state === "REQUESTING_PERMISSION" && (
          <>
            <div className="status-card">
              <span className="status-label">Select Screen</span>
              <span className="status-subtext">
                Choose the screen, window, or tab to share in the browser prompt.
              </span>
            </div>
            <StartButton onClick={handleStart} isLoading={true} />
          </>
        )}

        {(state === "RECORDING" || state === "STOPPING") && (
          <RecordingControls
            onStop={stopRecording}
            isStopping={state === "STOPPING"}
          />
        )}

        {state === "COMPLETED" && result && (
          <div className="controls-group">
            <div className="completed-card">
              <span className="status-label">Recording Complete</span>
              <span className="file-info">{result.filename}</span>
            </div>

            <button
              type="button"
              className="btn btn-success"
              onClick={downloadRecording}
            >
              Download Recording (.webm)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetRecording}
            >
              Record Again
            </button>
          </div>
        )}

        {state === "ERROR" && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetRecording}
          >
            Try Again
          </button>
        )}
      </main>

      <footer className="footer">100% Offline &amp; Private</footer>
    </div>
  );
};
