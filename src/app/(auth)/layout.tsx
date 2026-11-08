import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexWrap: "wrap",
        background: "var(--surface)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <section
        className="cc-hide-sm"
        style={{
          flex: "1 1 480px",
          minWidth: 0,
          background: "var(--brand)",
          color: "var(--on-brand)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 480 220"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "auto",
            opacity: 0.9,
          }}
          preserveAspectRatio="xMidYMax slice"
        >
          <g fill="var(--brand-soft)">
            <path d="M0 100a20 20 0 0 1 40 0zM40 100a20 20 0 0 1 40 0zM80 100a20 20 0 0 1 40 0zM120 100a20 20 0 0 1 40 0zM160 100a20 20 0 0 1 40 0zM200 100a20 20 0 0 1 40 0zM240 100a20 20 0 0 1 40 0zM280 100a20 20 0 0 1 40 0zM320 100a20 20 0 0 1 40 0zM360 100a20 20 0 0 1 40 0zM400 100a20 20 0 0 1 40 0zM440 100a20 20 0 0 1 40 0z" />
            <path d="M-20 140a20 20 0 0 1 40 0zM20 140a20 20 0 0 1 40 0zM60 140a20 20 0 0 1 40 0zM100 140a20 20 0 0 1 40 0zM140 140a20 20 0 0 1 40 0zM180 140a20 20 0 0 1 40 0zM220 140a20 20 0 0 1 40 0zM260 140a20 20 0 0 1 40 0zM300 140a20 20 0 0 1 40 0zM340 140a20 20 0 0 1 40 0zM380 140a20 20 0 0 1 40 0zM420 140a20 20 0 0 1 40 0zM460 140a20 20 0 0 1 40 0z" />
            <path d="M0 180a20 20 0 0 1 40 0zM40 180a20 20 0 0 1 40 0zM80 180a20 20 0 0 1 40 0zM120 180a20 20 0 0 1 40 0zM160 180a20 20 0 0 1 40 0zM200 180a20 20 0 0 1 40 0zM240 180a20 20 0 0 1 40 0zM280 180a20 20 0 0 1 40 0zM320 180a20 20 0 0 1 40 0zM360 180a20 20 0 0 1 40 0zM400 180a20 20 0 0 1 40 0zM440 180a20 20 0 0 1 40 0z" />
            <rect x="0" y="180" width="480" height="40" />
          </g>
        </svg>
        <div className="cc-logo" style={{ padding: 0, position: "relative" }}>
          Contas da Casa
        </div>
        <div style={{ position: "relative", maxWidth: 420, marginBottom: 200 }}>
          <p className="display" style={{ fontSize: 44, lineHeight: "48px" }}>
            As contas da família, cada um no seu lugar.
          </p>
        </div>
      </section>

      <main
        style={{
          flex: "1 1 420px",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div className="cc-only-sm" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="cc-logo" style={{ padding: 0, color: "var(--brand-ink)" }}>
              Contas da Casa
            </span>
            <span className="body cc-muted">As contas da família, cada um no seu lugar.</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
