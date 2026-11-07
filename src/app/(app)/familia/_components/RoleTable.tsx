"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function RoleTable() {
  const tableboxRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollIndicators = useCallback(() => {
    const el = tableboxRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    window.addEventListener("resize", updateScrollIndicators);
    return () => window.removeEventListener("resize", updateScrollIndicators);
  }, [updateScrollIndicators]);

  return (
    <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h2 className="title">O que cada papel pode fazer</h2>
      <div style={{ position: "relative" }}>
        <div
          ref={tableboxRef}
          onScroll={updateScrollIndicators}
          className="cc-tablebox"
          tabIndex={0}
          aria-label="Tabela de permissões por papel, rolável horizontalmente"
          style={{ boxShadow: "none" }}
        >
          <table className="cc-table" style={{ minWidth: "520px" }}>
            <thead>
              <tr>
                <th scope="col">Papel</th>
                <th scope="col">Lançar e editar as próprias</th>
                <th scope="col">Editar as dos outros</th>
                <th scope="col">Membros, mês e cadastros</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>Dono</th>
                <td>Sim</td>
                <td>Sim</td>
                <td>Sim, e pode excluir a família</td>
              </tr>
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>Admin</th>
                <td>Sim</td>
                <td>Sim</td>
                <td>Sim</td>
              </tr>
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>Membro</th>
                <td>Sim</td>
                <td>Não</td>
                <td>Não</td>
              </tr>
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>Dependente</th>
                <td colSpan={3} className="cc-muted">
                  Sem login; dono e admin lançam por ele
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Fade indicador na borda esquerda quando rolado */}
        <div
          aria-hidden="true"
          className="cc-only-sm"
          style={{
            position: "absolute",
            top: 1,
            bottom: 1,
            left: 1,
            width: 28,
            pointerEvents: "none",
            background: "linear-gradient(to right, var(--surface-raised), transparent)",
            borderTopLeftRadius: "var(--radius-lg)",
            borderBottomLeftRadius: "var(--radius-lg)",
            opacity: canScrollLeft ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />

        {/* Fade indicador na borda direita quando há mais conteúdo */}
        <div
          aria-hidden="true"
          className="cc-only-sm"
          style={{
            position: "absolute",
            top: 1,
            bottom: 1,
            right: 1,
            width: 28,
            pointerEvents: "none",
            background: "linear-gradient(to left, var(--surface-raised), transparent)",
            borderTopRightRadius: "var(--radius-lg)",
            borderBottomRightRadius: "var(--radius-lg)",
            opacity: canScrollRight ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </div>

      <span className="caption cc-muted cc-only-sm" style={{ display: "block" }}>
        Deslize a tabela para o lado para ver todas as colunas →
      </span>
    </div>
  );
}
