import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export const metadata: Metadata = {
  title: "Página não encontrada — Contas da Casa",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-5) var(--space-4)",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: "var(--space-6)" }}>
        <Link
          href="/"
          className="cc-logo"
          style={{
            textDecoration: "none",
            color: "var(--ink)",
            fontSize: "20px",
            display: "inline-block",
          }}
        >
          Contas da Casa
        </Link>
      </header>

      <main
        className="cc-card"
        style={{
          width: "100%",
          maxWidth: "460px",
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
            background: "var(--brand-soft)",
            color: "var(--brand-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <FileQuestion size={28} strokeWidth={2} />
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
            Página não encontrada
          </h1>
          <p
            className="body cc-muted"
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--ink-muted)",
            }}
          >
            O endereço que você tentou acessar não existe, foi alterado ou está temporariamente indisponível.
          </p>
        </div>

        <div
          className="cc-actions cc-actions--wide"
          style={{
            marginTop: "var(--space-2)",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link
            href="/"
            className="cc-btn cc-btn--primary"
            style={{
              textDecoration: "none",
              minHeight: "40px",
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Ir para o Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
