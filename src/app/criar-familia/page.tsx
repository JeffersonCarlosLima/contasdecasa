import type { Metadata } from "next";
import { guardCriarFamilia } from "./guard";
import { CriarFamiliaForm } from "./CriarFamiliaForm";

export const metadata: Metadata = {
  title: "Criar família — Contas da Casa",
};

export default async function CriarFamiliaPage() {
  await guardCriarFamilia();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        justifyContent: "center",
        padding: "32px 16px 48px",
        boxSizing: "border-box",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <span className="cc-logo" style={{ padding: 0, color: "var(--brand-ink)" }}>
          Contas da Casa
        </span>

        <CriarFamiliaForm />
      </main>
    </div>
  );
}
