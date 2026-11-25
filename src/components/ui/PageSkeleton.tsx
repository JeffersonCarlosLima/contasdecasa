const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

export interface PageSkeletonProps {
  /** Quantidade de cartões de KPI no topo (0 = nenhum). */
  kpis?: number;
  /** Linhas da lista/cartão principal. */
  rows?: number;
  /** Mostra os botões de ação na barra superior. */
  actions?: boolean;
}

/**
 * Esqueleto de página para `loading.tsx`: mesma estrutura de `cc-top` / `cc-kpis` / `cc-card`
 * da página final, para não deslocar o layout quando o conteúdo chega.
 */
export function PageSkeleton({ kpis = 0, rows = 4, actions = true }: PageSkeletonProps) {
  return (
    <main className="cc-main" role="status" aria-busy="true" aria-label="Carregando página">
      <span style={srOnly}>Carregando informações…</span>
      <div className="cc-wrap">
        <div className="cc-top">
          <div className="cc-top__titles" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div className="cc-skel" style={{ width: "180px", height: "28px" }} />
            <div className="cc-skel" style={{ width: "260px", height: "18px" }} />
          </div>
          {actions && (
            <div className="cc-actions">
              <div className="cc-skel" style={{ width: "140px", height: "40px" }} />
              <div className="cc-skel cc-hide-sm" style={{ width: "130px", height: "40px" }} />
            </div>
          )}
        </div>

        {kpis > 0 && (
          <div className="cc-kpis" style={{ padding: 0 }}>
            {Array.from({ length: kpis }, (_, i) => (
              <div key={i} className="cc-card cc-kpi" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div className="cc-skel" style={{ width: "90px", height: "14px" }} />
                <div className="cc-skel" style={{ width: "130px", height: "32px" }} />
              </div>
            ))}
          </div>
        )}

        <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="cc-skel" style={{ width: "150px", height: "20px" }} />
            <div className="cc-skel" style={{ width: "80px", height: "20px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: i < rows - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div className="cc-skel" style={{ width: "36px", height: "36px", borderRadius: "var(--radius-full)", flexShrink: 0 }} />
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
