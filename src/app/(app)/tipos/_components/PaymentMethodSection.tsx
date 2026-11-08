"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Landmark, QrCode } from "lucide-react";
import { SegmentedControl } from "@/components/ui";
import { savePaymentMethod, setPaymentMethodArchived } from "../actions";
import type {
  ActionResponse,
  FamilyMemberItem,
  PaymentMethodItem,
  PaymentMethodType,
  SavePaymentMethodInput,
} from "./types";
import { PAYMENT_TYPE_LABELS } from "./types";

function PaymentMethodIcon({ type }: { type: PaymentMethodType }) {
  const iconProps = {
    width: 18,
    height: 18,
    strokeWidth: 1.75,
    "aria-hidden": true as const,
  };

  switch (type) {
    case "cartao":
      return <CreditCard {...iconProps} />;
    case "conta":
      return <Landmark {...iconProps} />;
    case "pix":
      return <QrCode {...iconProps} />;
    case "dinheiro":
      return <Banknote {...iconProps} />;
    default:
      return <Landmark {...iconProps} />;
  }
}

function formatPaymentMethodMeta(
  item: PaymentMethodItem,
  memberMap: Map<string, string>
): string {
  const typeLabel =
    PAYMENT_TYPE_LABELS[item.type as PaymentMethodType] ?? item.type;
  const ownerLabel =
    item.ownerMemberId && memberMap.get(item.ownerMemberId)
      ? memberMap.get(item.ownerMemberId)!
      : "Família";

  if (item.type === "cartao" && item.cardLast4) {
    return `${typeLabel} •••• ${item.cardLast4} · ${ownerLabel}`;
  }

  return `${typeLabel} · ${ownerLabel}`;
}

export interface PaymentMethodSectionProps {
  paymentMethods: PaymentMethodItem[];
  members: FamilyMemberItem[];
  canEdit: boolean;
  onSave?: (input: SavePaymentMethodInput) => Promise<ActionResponse>;
  onArchive?: (id: string) => Promise<ActionResponse>;
  onReactivate?: (id: string) => Promise<ActionResponse>;
}

export function PaymentMethodSection({
  paymentMethods,
  members,
  canEdit,
  onSave,
  onArchive,
  onReactivate,
}: PaymentMethodSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingMethod, setEditingMethod] =
    useState<PaymentMethodItem | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethodType>("cartao");
  const [ownerMemberId, setOwnerMemberId] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const memberMap = new Map<string, string>();
  for (const m of members) {
    memberMap.set(m.id, m.displayName);
  }

  const activeMembers = members.filter((m) => m.status === "ativo");

  const activeMethods = paymentMethods.filter((pm) => !pm.archived);
  const archivedMethods = paymentMethods.filter((pm) => pm.archived);

  function resetForm() {
    setEditingMethod(null);
    setName("");
    setType("cartao");
    setOwnerMemberId(null);
    setCardLast4("");
    setClosingDay("");
    setDueDay("");
    setErrorMessage(null);
  }

  function handleStartEdit(item: PaymentMethodItem) {
    setEditingMethod(item);
    setName(item.name);
    setType(item.type as PaymentMethodType);
    setOwnerMemberId(item.ownerMemberId ?? null);
    setCardLast4(item.cardLast4 ?? "");
    setClosingDay(item.closingDay ? String(item.closingDay) : "");
    setDueDay(item.dueDay ? String(item.dueDay) : "");
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
      cardLast4: type === "cartao" && cardLast4 ? cardLast4.trim() : null,
      closingDay: type === "cartao" && closingDay ? Number(closingDay) : null,
      dueDay: type === "cartao" && dueDay ? Number(dueDay) : null,
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

  async function handleArchive() {
    if (!editingMethod) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res: ActionResponse = onArchive
          ? await onArchive(editingMethod.id)
          : await setPaymentMethodArchived({
              id: editingMethod.id,
              archived: true,
            });

        if (!res.ok) {
          setErrorMessage(
            res.error || "Não foi possível arquivar a forma de pagamento."
          );
          return;
        }

        resetForm();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao arquivar."
        );
      }
    });
  }

  async function handleReactivate(id: string) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res: ActionResponse = onReactivate
          ? await onReactivate(id)
          : await setPaymentMethodArchived({
              id,
              archived: false,
            });

        if (!res.ok) {
          setErrorMessage(
            res.error || "Não foi possível reativar a forma de pagamento."
          );
          return;
        }

        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao reativar."
        );
      }
    });
  }

  return (
    <section id="formas" aria-labelledby="formas-pagamento-title">
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
          aria-label="Formas cadastradas"
        >
          {paymentMethods.length === 0 ? (
            <div
              style={{ padding: "var(--space-4)", textAlign: "center" }}
              className="body cc-muted"
            >
              Cadastre o cartão ou a conta que aparece no seu extrato para poder
              importar e lançar despesas.
            </div>
          ) : (
            <>
              {activeMethods.map((pm) => (
                <div key={pm.id} className="cc-expense">
                  <div className="cc-expense__icon">
                    <PaymentMethodIcon type={pm.type as PaymentMethodType} />
                  </div>
                  <div className="cc-expense__main">
                    <span className="cc-expense__title">{pm.name}</span>
                    <span className="cc-expense__meta">
                      {formatPaymentMethodMeta(pm, memberMap)}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="cc-expense__side">
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost cc-btn--sm"
                        style={{ minHeight: "40px" }}
                        onClick={() => handleStartEdit(pm)}
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {archivedMethods.length > 0 && (
                <div style={{ marginTop: "var(--space-4)" }}>
                  <div
                    className="caption cc-muted"
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      fontWeight: "var(--font-medium)",
                    }}
                  >
                    Arquivadas
                  </div>
                  {archivedMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="cc-expense"
                      style={{ opacity: 0.65 }}
                    >
                      <div className="cc-expense__icon">
                        <PaymentMethodIcon
                          type={pm.type as PaymentMethodType}
                        />
                      </div>
                      <div className="cc-expense__main">
                        <span className="cc-expense__title">{pm.name}</span>
                        <span className="cc-expense__meta">
                          {formatPaymentMethodMeta(pm, memberMap)} (Arquivada)
                        </span>
                      </div>
                      {canEdit && (
                        <div className="cc-expense__side">
                          <button
                            type="button"
                            className="cc-btn cc-btn--ghost cc-btn--sm"
                            style={{ minHeight: "40px" }}
                            onClick={() => handleReactivate(pm.id)}
                            disabled={isPending}
                          >
                            Reativar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
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
              {editingMethod
                ? "Editar forma de pagamento"
                : "Nova forma de pagamento"}
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
                  placeholder="Ex.: Nubank"
                  required
                  disabled={isPending}
                />
              </span>
            </label>

            <div className="cc-field">
              <span className="cc-field__label">Tipo</span>
              <SegmentedControl
                options={[
                  { value: "cartao", label: "Cartão" },
                  { value: "conta", label: "Conta" },
                  { value: "pix", label: "Pix" },
                  { value: "dinheiro", label: "Dinheiro" },
                ]}
                value={type}
                onChange={(val) => setType(val as PaymentMethodType)}
                disabled={isPending}
              />
            </div>

            <label className="cc-field">
              <span className="cc-field__label">Dono</span>
              <select
                className="cc-select"
                style={{ height: "44px" }}
                value={ownerMemberId ?? ""}
                onChange={(e) => setOwnerMemberId(e.target.value || null)}
                disabled={isPending}
              >
                <option value="">Família</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </label>

            {type === "cartao" && (
              <>
                <label className="cc-field">
                  <span className="cc-field__label">Final do cartão</span>
                  <span className="cc-input">
                    <input
                      className="cc-input__text"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={cardLast4}
                      onChange={(e) =>
                        setCardLast4(
                          e.target.value.replace(/\D/g, "").slice(0, 4)
                        )
                      }
                      placeholder="Ex.: 1234"
                      disabled={isPending}
                    />
                  </span>
                  <span className="cc-field__hint">
                    4 dígitos para identificar nos extratos.
                  </span>
                </label>

                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <label className="cc-field" style={{ flex: 1, minWidth: 0 }}>
                    <span className="cc-field__label">Dia de fechamento</span>
                    <span className="cc-input">
                      <input
                        className="cc-input__text"
                        type="number"
                        min={1}
                        max={31}
                        value={closingDay}
                        onChange={(e) => setClosingDay(e.target.value)}
                        placeholder="Ex.: 5"
                        disabled={isPending}
                      />
                    </span>
                  </label>

                  <label className="cc-field" style={{ flex: 1, minWidth: 0 }}>
                    <span className="cc-field__label">Dia de vencimento</span>
                    <span className="cc-input">
                      <input
                        className="cc-input__text"
                        type="number"
                        min={1}
                        max={31}
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        placeholder="Ex.: 15"
                        disabled={isPending}
                      />
                    </span>
                  </label>
                </div>
                <span
                  className="cc-field__hint"
                  style={{ marginTop: "calc(-1 * var(--space-2))" }}
                >
                  Fechamento e vencimento devem ser preenchidos juntos.
                </span>
              </>
            )}

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
                  style={{ minHeight: "40px" }}
                  disabled={isPending}
                >
                  Salvar forma
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--secondary"
                  style={{ minHeight: "40px" }}
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--danger"
                  style={{ minHeight: "40px" }}
                  onClick={handleArchive}
                  disabled={isPending}
                >
                  Arquivar
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="cc-btn cc-btn--primary"
                style={{ minHeight: "40px" }}
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
