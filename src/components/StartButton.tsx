import React from "react";

interface StartButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const StartButton: React.FC<StartButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex-center">
          <span className="spinner" />
          Requesting Screen...
        </span>
      ) : (
        <span className="flex-center">
          <span className="record-circle-icon" />
          Start Recording
        </span>
      )}
    </button>
  );
};
