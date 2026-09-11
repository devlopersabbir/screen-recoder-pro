import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, ariaLabel }) => {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        background: checked ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#ffffff",
          position: "absolute",
          top: "3px",
          left: checked ? "23px" : "3px",
          transition: "left 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
        }}
      />
    </div>
  );
};
