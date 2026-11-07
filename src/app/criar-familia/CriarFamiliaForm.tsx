"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, SegmentedControl } from "@/components/ui";
import { createFamily } from "./actions";

type KinshipOption = "titular" | "conjuge" | "outro";
type SplitOption = "igual" | "proporcional" | "personalizada";

export function CriarFamiliaForm() {
  const [name, setName] = useState("");
  const [kinship, setKinship] = useState<KinshipOption>("titular");
  const [splitRule, setSplitRule] = useState<SplitOption>("proporcional");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await createFamily({
        name: name.trim(),
        kinship,
        splitRule,
        inviteEmail: inviteEmail.trim() || undefined,
      });

      if (res && !res.ok) {
        setError(res.error || "Erro ao criar família. Confira e tente de novo.");
        setLoading(false);
      }
    } catch (err: unknown) {
      if ((err as Error)?.message?.includes("NEXT_REDIRECT")) {
        throw err;
      }
      setError((err as Error)?.message || "Erro ao criar família. Confira e tente de novo.");
      setLoading(false);
    }
  };

  return (
    <>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
        aria-label="Etapas"
      >
        <li className="cc-badge cc-badge--paid">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          1. Sua conta
        </li>
        <li
          className="cc-badge"
          style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
          aria-current="step"
        >
          2. Sua família
        </li>
        <li
          className="cc-badge"
          style={{ background: "var(--surface-sunken)", color: "var(--ink-muted)" }}
        >
          3. Convidar
        </li>
      </ol>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="heading">Crie a sua família</h1>
        <span className="body cc-muted">
          É onde ficam as contas de todos. Você será o dono e pode convidar os outros membros em seguida.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{ fontSize: 13, lineHeight: "18px" }}
        >
          {error}
        </div>
      )}

      <form
        className="cc-card"
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Field
          label="Nome da família"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Família Lima"
          hint="Aparece no menu e nos convites."
          required
        />

        <div className="cc-field">
          <span className="cc-field__label">Você é</span>
          <SegmentedControl
            label="Seu parentesco"
            options={[
              { value: "titular", label: "Titular" },
              { value: "conjuge", label: "Cônjuge" },
              { value: "outro", label: "Outro" },
            ]}
            value={kinship}
            onChange={(val) => setKinship(val as KinshipOption)}
          />
        </div>

        <div className="cc-field">
          <span className="cc-field__label">Como dividir as despesas da família</span>
          <SegmentedControl
            label="Regra de divisão"
            options={[
              { value: "igual", label: "Partes iguais" },
              { value: "proporcional", label: "Proporcional ao salário" },
              { value: "personalizada", label: "Personalizada" },
            ]}
            value={splitRule}
            onChange={(val) => setSplitRule(val as SplitOption)}
          />
          <span className="cc-field__hint">Dá para mudar depois, inclusive mês a mês.</span>
        </div>

        <div className="cc-formfoot">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !name.trim()}
          >
            Criar família e continuar
          </Button>
        </div>
      </form>

      <section
        className="cc-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "var(--surface-sunken)",
          border: 0,
          boxShadow: "none",
        }}
      >
        <h2 className="title">Próximo: convidar quem divide as contas com você</h2>
        <label
          htmlFor="invite-email"
          className="cc-input"
          style={{ background: "var(--surface-raised)", cursor: "text" }}
        >
          <input
            id="invite-email"
            className="cc-input__text"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email do cônjuge"
            autoComplete="email"
            aria-label="Email de quem divide as contas"
          />
        </label>
        <span className="caption cc-muted">
          Você também pode adicionar filhos como dependentes, sem login. Pular esta etapa não perde nada.
        </span>
      </section>

      <div
        className="cc-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span className="label">Recebeu um convite?</span>
        <span className="caption cc-muted">
          Não crie outra família: abra o link do convite e você entra direto na família que te convidou.
        </span>
      </div>
    </>
  );
}
