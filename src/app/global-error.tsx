"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "var(--surface, #f6f3ec)",
          color: "var(--ink, #1d2421)",
          fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "var(--surface-raised, #ffffff)",
            border: "1px solid var(--line, #d9d1c2)",
            borderRadius: "var(--radius-lg, 16px)",
            boxShadow: "0 1px 2px rgba(29,36,33,0.06), 0 4px 12px rgba(29,36,33,0.05)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "999px",
              background: "var(--danger-soft, #f8dde2)",
              color: "var(--danger, #a3203c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <AlertTriangle size={28} strokeWidth={2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                lineHeight: "28px",
                fontWeight: 600,
                color: "var(--ink, #1d2421)",
              }}
            >
              Algo deu errado
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "20px",
                color: "var(--ink-muted, #5a615c)",
              }}
            >
              Ocorreu uma falha grave inesperada. Você pode tentar recarregar a aplicação ou ir para o início.
            </p>
          </div>

          <div
            style={{
              marginTop: "8px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "40px",
                width: "100%",
                background: "var(--brand, #b0502a)",
                color: "var(--on-brand, #ffffff)",
                border: "none",
                borderRadius: "var(--radius-md, 10px)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Tentar de novo
            </button>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                minHeight: "40px",
                width: "100%",
                background: "var(--surface-raised, #ffffff)",
                color: "var(--ink, #1d2421)",
                border: "1px solid var(--line-strong, #8b8477)",
                borderRadius: "var(--radius-md, 10px)",
                fontSize: "15px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
