import React from "react";

interface RecordingControlsProps {
  onStop: () => void;
  isStopping?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onStop,
  isStopping,
}) => {
  return (
    <div className="controls-group">
      <div className="status-pill recording-active">
        <span className="pulsing-dot" />
        Recording in progress
      </div>

      <button
        type="button"
        className="btn btn-danger"
        onClick={onStop}
        disabled={isStopping}
      >
        <span className="flex-center">
          <span className="stop-square-icon" />
          {isStopping ? "Stopping..." : "Stop Recording"}
        </span>
      </button>
    </div>
  );
};
