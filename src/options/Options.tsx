import React from "react";

export const Options: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "rgba(18, 24, 38, 0.8)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "48px 64px",
          textAlign: "center",
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.6)",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#ffffff",
            }}
          />
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "12px",
            letterSpacing: "-0.5px",
          }}
        >
          Hello World
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Screen Recorder Pro Options Page
        </p>
      </div>
    </div>
  );
};
