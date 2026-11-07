export default function AppLoading() {
  return (
    <main className="cc-main" role="status" aria-busy="true" aria-label="Carregando página">
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Carregando informações…
      </span>

      <style>{`
        @keyframes cc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .cc-skel {
          background: var(--surface-sunken);
          border-radius: var(--radius-md);
          animation: cc-pulse 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cc-skel {
            animation: none !important;
          }
        }
      `}</style>

      <div className="cc-wrap">
        {/* Top bar skeleton */}
        <div className="cc-top">
          <div className="cc-top__titles" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="cc-skel" style={{ width: "180px", height: "28px" }} />
            <div className="cc-skel" style={{ width: "260px", height: "18px" }} />
          </div>
          <div className="cc-actions">
            <div className="cc-skel" style={{ width: "140px", height: "40px" }} />
            <div className="cc-skel cc-hide-sm" style={{ width: "130px", height: "40px" }} />
          </div>
        </div>

        {/* KPIs skeleton */}
        <div className="cc-kpis" style={{ padding: 0 }}>
          <div className="cc-card cc-kpi" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="cc-skel" style={{ width: "90px", height: "14px" }} />
            <div className="cc-skel" style={{ width: "130px", height: "32px" }} />
          </div>
          <div className="cc-card cc-kpi" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="cc-skel" style={{ width: "90px", height: "14px" }} />
            <div className="cc-skel" style={{ width: "130px", height: "32px" }} />
          </div>
          <div className="cc-card cc-kpi" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="cc-skel" style={{ width: "90px", height: "14px" }} />
            <div className="cc-skel" style={{ width: "130px", height: "32px" }} />
          </div>
        </div>

        {/* Content list / card skeleton */}
        <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="cc-skel" style={{ width: "150px", height: "20px" }} />
            <div className="cc-skel" style={{ width: "80px", height: "20px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: item < 4 ? "1px solid var(--line)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div
                    className="cc-skel"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-full)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <div className="cc-skel" style={{ width: "160px", height: "16px" }} />
                    <div className="cc-skel" style={{ width: "100px", height: "12px" }} />
                  </div>
                </div>
                <div className="cc-skel" style={{ width: "70px", height: "20px" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
