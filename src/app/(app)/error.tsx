"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ reset }: AppErrorProps) {
  return (
    <main className="cc-main">
      <div
        className="cc-wrap"
        style={{
          maxWidth: "520px",
          margin: "40px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="cc-card"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "var(--space-4)",
            padding: "var(--space-6) var(--space-5)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-full)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <AlertTriangle size={28} strokeWidth={2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <h1
              className="heading"
              style={{
                margin: 0,
                fontSize: "22px",
                lineHeight: "28px",
                color: "var(--ink)",
              }}
            >
              Algo deu errado
            </h1>
            <p
              className="body cc-muted"
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "20px",
                color: "var(--ink-muted)",
                maxWidth: "380px",
              }}
            >
              Ocorreu uma falha inesperada ao carregar as informações desta seção. Você pode tentar recarregar ou voltar para o início.
            </p>
          </div>

          <div
            className="cc-formfoot cc-actions--wide"
            style={{
              marginTop: "var(--space-2)",
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              justifyContent: "center",
              borderTop: "none",
              paddingTop: 0,
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              className="cc-btn cc-btn--primary"
              style={{
                minHeight: "40px",
                flex: "1 1 160px",
              }}
            >
              Tentar de novo
            </button>
            <Link
              href="/"
              className="cc-btn cc-btn--secondary"
              style={{
                textDecoration: "none",
                minHeight: "40px",
                flex: "1 1 160px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
