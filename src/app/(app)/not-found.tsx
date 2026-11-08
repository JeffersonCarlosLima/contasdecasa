import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AppNotFound() {
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
                maxWidth: "380px",
              }}
            >
              O item ou recurso que você tentou acessar não foi encontrado, foi alterado ou não existe mais.
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
                maxWidth: "240px",
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
