"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePaymentMethod, savePaymentMethod } from "../actions";
import type {
  ActionResponse,
  FamilyMemberItem,
  PaymentMethodItem,
  PaymentMethodType,
  SavePaymentMethodInput,
} from "./types";
import { PAYMENT_TYPE_LABELS } from "./types";

function PaymentMethodIcon({ type }: { type: PaymentMethodType }) {
  if (type === "cartao") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    );
  }
  if (type === "pix") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  if (type === "dinheiro") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <line x1="6" y1="12" x2="6.01" y2="12" />
        <line x1="18" y1="12" x2="18.01" y2="12" />
      </svg>
    );
  }
  // conta bancária padrão
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="4" y1="10" x2="4" y2="18" />
      <line x1="12" y1="10" x2="12" y2="18" />
      <line x1="20" y1="10" x2="20" y2="18" />
      <polygon points="12 3 2 8 22 8 12 3" />
    </svg>
  );
}

export interface PaymentMethodSectionProps {
  paymentMethods: PaymentMethodItem[];
  members: FamilyMemberItem[];
  canEdit: boolean;
  onSave?: (input: SavePaymentMethodInput) => Promise<ActionResponse>;
  onDelete?: (id: string) => Promise<ActionResponse>;
}

export function PaymentMethodSection({
  paymentMethods,
  members,
  canEdit,
  onSave,
  onDelete,
}: PaymentMethodSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingMethod, setEditingMethod] =
    useState<PaymentMethodItem | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethodType>("cartao");
  const [ownerMemberId, setOwnerMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const memberMap = new Map<string, string>();
  for (const m of members) {
    memberMap.set(m.id, m.displayName);
  }

  function resetForm() {
    setEditingMethod(null);
    setName("");
    setType("cartao");
    setOwnerMemberId(null);
    setErrorMessage(null);
  }

  function handleStartEdit(item: PaymentMethodItem) {
    setEditingMethod(item);
    setName(item.name);
    setType(item.type as PaymentMethodType);
    setOwnerMemberId(item.ownerMemberId ?? null);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const input: SavePaymentMethodInput = {
      id: editingMethod?.id,
      name: name.trim(),
      type,
      ownerMemberId: ownerMemberId || null,
    };

    startTransition(async () => {
      try {
        const res: ActionResponse = onSave
          ? await onSave(input)
          : await savePaymentMethod(input);

        if (!res.ok) {
          setErrorMessage(
            res.error || "Não foi possível salvar a forma de pagamento."
          );
          return;
        }

        resetForm();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao salvar."
        );
      }
    });
  }

  async function handleDelete() {
    if (!editingMethod) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res: ActionResponse = onDelete
          ? await onDelete(editingMethod.id)
          : await deletePaymentMethod({ id: editingMethod.id });

        if (!res.ok) {
          setErrorMessage(
            res.error || "Não foi possível excluir a forma de pagamento."
          );
          return;
        }

        resetForm();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao excluir."
        );
      }
    });
  }

  return (
    <section aria-labelledby="formas-pagamento-title">
      <div className="cc-top" style={{ marginTop: "var(--space-8)" }}>
        <div className="cc-top__titles">
          <h2 id="formas-pagamento-title" className="title">
            Formas de pagamento
          </h2>
          <span className="body cc-muted">
            Contas bancárias, cartões e outras formas usadas para pagar despesas.
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
        <div
          className="cc-list"
          style={{ flex: "999 1 520px", minWidth: 0 }}
          role="region"
          aria-label="Formas de pagamento cadastradas"
        >
          {paymentMethods.length === 0 ? (
            <div
              style={{ padding: "var(--space-4)", textAlign: "center" }}
              className="body cc-muted"
            >
              Nenhuma forma de pagamento cadastrada.
            </div>
          ) : (
            paymentMethods.map((pm) => {
              const ownerName = pm.ownerMemberId
                ? memberMap.get(pm.ownerMemberId)
                : null;
              return (
                <div key={pm.id} className="cc-expense">
                  <div className="cc-expense__icon">
                    <PaymentMethodIcon type={pm.type as PaymentMethodType} />
                  </div>
                  <div className="cc-expense__main">
                    <span className="cc-expense__title">{pm.name}</span>
                    <span className="cc-expense__meta">
                      {PAYMENT_TYPE_LABELS[pm.type as PaymentMethodType] ??
                        pm.type}
                      {ownerName && <> · {ownerName}</>}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="cc-expense__side">
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost cc-btn--sm"
                        onClick={() => handleStartEdit(pm)}
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
              {editingMethod ? "Editar forma" : "Nova forma"}
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

            <label className="cc-field">
              <span className="cc-field__label">Nome</span>
              <span className="cc-input">
                <input
                  className="cc-input__text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Nubank, Carteira..."
                  required
                  disabled={isPending}
                />
              </span>
            </label>

            <div className="cc-field">
              <span className="cc-field__label">Tipo</span>
              <div className="cc-seg" role="group" aria-label="Tipo de pagamento">
                <button
                  type="button"
                  aria-pressed={type === "cartao"}
                  onClick={() => setType("cartao")}
                  disabled={isPending}
                >
                  Cartão
                </button>
                <button
                  type="button"
                  aria-pressed={type === "conta"}
                  onClick={() => setType("conta")}
                  disabled={isPending}
                >
                  Conta
                </button>
                <button
                  type="button"
                  aria-pressed={type === "pix"}
                  onClick={() => setType("pix")}
                  disabled={isPending}
                >
                  Pix
                </button>
                <button
                  type="button"
                  aria-pressed={type === "dinheiro"}
                  onClick={() => setType("dinheiro")}
                  disabled={isPending}
                >
                  Dinheiro
                </button>
              </div>
            </div>

            <label className="cc-field">
              <span className="cc-field__label">Dono (opcional)</span>
              <select
                className="cc-select"
                value={ownerMemberId ?? ""}
                onChange={(e) => setOwnerMemberId(e.target.value || null)}
                disabled={isPending}
              >
                <option value="">Família toda (compartilhado)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
              <span className="cc-field__hint">
                Deixe compartilhado se qualquer membro puder usar.
              </span>
            </label>

            {editingMethod ? (
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
                  Salvar forma
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
                Salvar forma
              </button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
