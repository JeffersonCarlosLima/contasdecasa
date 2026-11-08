"use client";

import { Field } from "@/components/ui";

export interface DadosCardProps {
  name: string;
  email: string;
}

export function DadosCard({ name, email }: DadosCardProps) {
  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="title">Dados</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Nome" value={name} readOnly disabled />
        <Field label="Email" type="email" value={email} readOnly disabled />
      </div>
    </section>
  );
}
