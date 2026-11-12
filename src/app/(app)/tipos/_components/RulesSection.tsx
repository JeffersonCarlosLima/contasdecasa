"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CategoryItem,
  FamilyMemberItem,
  PaymentMethodItem,
} from "./types";

export type MatchType = "contem" | "comeca";

export interface RuleItem {
  id: string;
  matchType: MatchType;
  pattern: string;
  displayName?: string | null;
  categoryId?: string;
  category?: { id: string; name: string; color: string } | null;
  ownerMemberId?: string | null;
  ownerMember?: { id: string; displayName: string; color?: string } | null;
  paymentMethodId?: string | null;
  paymentMethod?: { id: string; name: string } | null;
  priority?: number;
}

export interface SaveRuleInput {
  id?: string;
  matchType: MatchType;
  pattern: string;
  displayName?: string | null;
  categoryId: string;
  ownerId?: string | null;
  paymentMethodId?: string | null;
  priority?: number;
}

export interface RuleActionResponse {
  ok: boolean;
  error?: string;
}

export interface RulesSectionProps {
  rules?: RuleItem[];
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
  members: FamilyMemberItem[];
  canEdit: boolean;
  onSave?: (input: SaveRuleInput) => Promise<RuleActionResponse>;
  onDelete?: (id: string) => Promise<RuleActionResponse>;
}

async function defaultSaveRule(input: SaveRuleInput): Promise<RuleActionResponse> {
  try {
    const mod = await import("@/app/(app)/importar/actions");
    if (typeof mod.saveRule === "function") {
      return await mod.saveRule(input);
    }
    return { ok: false, error: "Ação não disponível no servidor." };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message || "Erro ao salvar regra." };
  }
}

async function defaultDeleteRule(id: string): Promise<RuleActionResponse> {
  try {
    const mod = await import("@/app/(app)/importar/actions");
    if (typeof mod.deleteRule === "function") {
      return await mod.deleteRule(id);
    }
    return { ok: false, error: "Ação não disponível no servidor." };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message || "Erro ao excluir regra." };
  }
}

export function RulesSection({
  rules = [],
  categories,
  paymentMethods,
  members,
  canEdit,
  onSave,
  onDelete,
}: RulesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("contem");
  const [pattern, setPattern] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [priority, setPriority] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryMap = new Map<string, CategoryItem>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  const memberMap = new Map<string, string>();
  for (const m of members) {
    memberMap.set(m.id, m.displayName);
  }

  const paymentMap = new Map<string, string>();
  for (const pm of paymentMethods) {
    paymentMap.set(pm.id, pm.name);
  }

  function resetForm() {
    setEditingRule(null);
    setMatchType("contem");
    setPattern("");
    setDisplayName("");
    setCategoryId(categories[0]?.id ?? "");
    setOwnerMemberId("");
    setPaymentMethodId("");
    setPriority(0);
    setErrorMessage(null);
  }

  function handleStartEdit(rule: RuleItem) {
    setEditingRule(rule);
    setMatchType(rule.matchType);
    setPattern(rule.pattern);
    setDisplayName(rule.displayName ?? "");
    setCategoryId(rule.category?.id ?? rule.categoryId ?? categories[0]?.id ?? "");
    setOwnerMemberId(rule.ownerMember?.id ?? rule.ownerMemberId ?? "");
    setPaymentMethodId(rule.paymentMethod?.id ?? rule.paymentMethodId ?? "");
    setPriority(rule.priority ?? 0);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pattern.trim()) {
      setErrorMessage("Informe o texto a ser identificado no extrato.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Selecione uma categoria para a regra.");
      return;
    }

    setErrorMessage(null);

    const input: SaveRuleInput = {
      id: editingRule?.id,
      matchType,
      pattern: pattern.trim(),
      displayName: displayName.trim() ? displayName.trim() : null,
      categoryId,
      ownerId: ownerMemberId ? ownerMemberId : null,
      paymentMethodId: paymentMethodId ? paymentMethodId : null,
      priority: Number(priority) || 0,
    };

    startTransition(async () => {
      try {
        const res = onSave ? await onSave(input) : await defaultSaveRule(input);
        if (!res.ok) {
          setErrorMessage(res.error || "Não foi possível salvar a regra.");
          return;
        }

        resetForm();
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao salvar regra.",
        );
      }
    });
  }

  async function handleDelete() {
    if (!editingRule) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = onDelete
          ? await onDelete(editingRule.id)
          : await defaultDeleteRule(editingRule.id);

        if (!res.ok) {
          setErrorMessage(res.error || "Não foi possível excluir a regra.");
          return;
        }

        resetForm();
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao excluir regra.",
        );
      }
    });
  }

  return (
    <section aria-labelledby="regras-title" style={{ marginTop: "var(--space-8)" }}>
      <div className="cc-top">
        <div className="cc-top__titles">
          <h2 id="regras-title" className="title">
            Regras de classificação
          </h2>
          <span className="body cc-muted">
            Atribua automaticamente categoria, membro e meio de pagamento ao importar extratos.
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
          marginTop: "var(--space-4)",
        }}
      >
        {/* Lista de regras */}
        <div
          className="cc-list"
          style={{ flex: "999 1 520px", minWidth: 0 }}
          role="region"
          aria-label="Regras cadastradas"
        >
          {rules.length === 0 ? (
            <div
              style={{ padding: "var(--space-4)", textAlign: "center" }}
              className="body cc-muted"
            >
              Nenhuma regra de classificação cadastrada.
            </div>
          ) : (
            rules.map((rule) => {
              const cat =
                rule.category ??
                (rule.categoryId ? categoryMap.get(rule.categoryId) : undefined);
              const ownerName =
                rule.ownerMember?.displayName ??
                (rule.ownerMemberId ? memberMap.get(rule.ownerMemberId) : null);
              const paymentName =
                rule.paymentMethod?.name ??
                (rule.paymentMethodId ? paymentMap.get(rule.paymentMethodId) : null);
              const matchLabel =
                rule.matchType === "comeca" ? "Começa com" : "Contém";

              return (
                <div key={rule.id} className="cc-expense">
                  <div className="cc-expense__icon">
                    <span
                      style={{
                        background: cat ? `var(--${cat.color})` : "var(--ink-muted)",
                        width: 10,
                        height: 10,
                        borderRadius: "var(--radius-full)",
                        display: "inline-block",
                      }}
                    />
                  </div>
                  <div className="cc-expense__main">
                    <span className="cc-expense__title">
                      {rule.pattern}
                      {rule.displayName ? <> → {rule.displayName}</> : null}
                    </span>
                    <span className="cc-expense__meta">
                      <span>{matchLabel}</span>
                      {cat && <> · <strong>{cat.name}</strong></>}
                      {ownerName ? <> · {ownerName}</> : <> · Família</>}
                      {paymentName && <> · {paymentName}</>}
                      {rule.priority !== undefined && rule.priority > 0 && (
                        <> · Prioridade {rule.priority}</>
                      )}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="cc-expense__side">
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost cc-btn--sm"
                        style={{ minHeight: "40px" }}
                        onClick={() => handleStartEdit(rule)}
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Card de formulário */}
        {canEdit && (
          <form
            className="cc-card"
            style={{
              flex: "1 1 320px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onSubmit={handleSubmit}
          >
            <h3 className="title">
              {editingRule ? "Editar regra" : "Nova regra"}
            </h3>

            {errorMessage && (
              <div
                className="caption"
                style={{ color: "var(--danger)" }}
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div className="cc-field">
              <span className="cc-field__label">Correspondência</span>
              <div className="cc-seg" role="group" aria-label="Tipo de correspondência">
                <button
                  type="button"
                  aria-pressed={matchType === "contem"}
                  style={{ minHeight: "40px" }}
                  onClick={() => setMatchType("contem")}
                  disabled={isPending}
                >
                  Contém
                </button>
                <button
                  type="button"
                  aria-pressed={matchType === "comeca"}
                  style={{ minHeight: "40px" }}
                  onClick={() => setMatchType("comeca")}
                  disabled={isPending}
                >
                  Começa com
                </button>
              </div>
            </div>

            <label className="cc-field">
              <span className="cc-field__label">Texto a buscar no extrato</span>
              <span className="cc-input">
                <input
                  className="cc-input__text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Ex.: UBER, POSTO, NETFLIX..."
                  required
                  disabled={isPending}
                />
              </span>
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Nome a usar na despesa (opcional)</span>
              <span className="cc-input">
                <input
                  className="cc-input__text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex.: Mercado do bairro"
                  maxLength={120}
                  disabled={isPending}
                />
              </span>
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Categoria</span>
              <select
                className="cc-select"
                style={{ height: "44px" }}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isPending}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Dono (opcional)</span>
              <select
                className="cc-select"
                style={{ height: "44px" }}
                value={ownerMemberId}
                onChange={(e) => setOwnerMemberId(e.target.value)}
                disabled={isPending}
              >
                <option value="">Família toda (compartilhado)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Forma de pagamento (opcional)</span>
              <select
                className="cc-select"
                style={{ height: "44px" }}
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                disabled={isPending}
              >
                <option value="">Qualquer forma de pagamento</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Prioridade (opcional)</span>
              <span className="cc-input">
                <input
                  className="cc-input__text"
                  type="number"
                  min="0"
                  max="1000"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                  disabled={isPending}
                />
              </span>
              <span className="cc-field__hint">
                Maior prioridade tem preferência se mais de uma regra bater.
              </span>
            </label>

            {editingRule ? (
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  className="cc-btn cc-btn--primary"
                  disabled={isPending}
                >
                  Salvar regra
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--secondary"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--danger"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Excluir
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="cc-btn cc-btn--primary"
                disabled={isPending}
              >
                Salvar regra
              </button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
