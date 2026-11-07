"use client";

import { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cx } from "@/components/ui/cx";
import { currentMonth, todayISO } from "@/lib/dates";
import { deleteExpense, saveExpense } from "@/app/(app)/despesas/actions";
import type { SaveExpenseInput } from "@/lib/validators/despesas";
import { ScopeModal, type ScopeActionType } from "./ScopeModal";
import {
  formatFamilyHint,
  formatInstallmentCaption,
  validateExpenseForm,
} from "./helpers";
import type { ExpenseFormProps } from "./types";

export function ExpenseForm({
  mode,
  currentMember,
  defaultSplitRule,
  categories,
  paymentMethods,
  members,
  initialExpense,
  initialMonth,
  canEdit = true,
  canDelete = true,
}: ExpenseFormProps) {
  const router = useRouter();
  const descId = useId();
  const dateId = useId();
  const notesId = useId();

  const isEdit = mode === "edit";
  const effectiveMonth = initialExpense
    ? initialExpense.referenceMonth.slice(0, 7)
    : initialMonth || currentMonth();

  const defaultDueDate = useMemo(() => {
    if (initialExpense?.dueDate) return initialExpense.dueDate;
    const nowMonth = currentMonth();
    if (effectiveMonth === nowMonth) return todayISO();
    return `${effectiveMonth}-01`;
  }, [initialExpense?.dueDate, effectiveMonth]);

  // Form states
  const [description, setDescription] = useState(initialExpense?.description ?? "");
  const [amountCents, setAmountCents] = useState<number | null>(initialExpense?.amountCents ?? null);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [categoryId, setCategoryId] = useState<string>(
    initialExpense?.categoryId ?? categories[0]?.id ?? ""
  );
  const [ownerMemberId, setOwnerMemberId] = useState<string | null>(
    initialExpense ? initialExpense.ownerMemberId : null
  );
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(
    initialExpense ? initialExpense.paymentMethodId : paymentMethods[0]?.id ?? null
  );
  const [isPaid, setIsPaid] = useState<boolean>(initialExpense?.status === "pago");
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(
    initialExpense?.paidByMemberId ?? (initialExpense?.status === "pago" ? currentMember.id : null)
  );

  const [isInstallment, setIsInstallment] = useState<boolean>(
    Boolean(initialExpense?.installment)
  );
  const [installmentCurrent, setInstallmentCurrent] = useState<number | "">(
    initialExpense?.installment?.current ?? 1
  );
  const [installmentTotal, setInstallmentTotal] = useState<number | "">(
    initialExpense?.installment?.total ?? 2
  );

  const [isRecurring, setIsRecurring] = useState<boolean>(
    Boolean(initialExpense?.recurring)
  );
  const [notes, setNotes] = useState(initialExpense?.notes ?? "");

  // UI / Feedback states
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  // Scope modal state
  const isSequence = Boolean(initialExpense?.installment || initialExpense?.recurring);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ScopeActionType>("save");
  const [pendingSubmitType, setPendingSubmitType] = useState<"saveAndClose" | "saveAndNew">("saveAndClose");

  // Dynamic hint for "De quem é a despesa"
  const splitMembers = members.filter((m) => m.participatesInSplit && m.status === "ativo");
  const familyHint = useMemo(() => {
    return formatFamilyHint({
      splitMembers,
      defaultSplitRule,
      currentUserName: currentMember.displayName,
    });
  }, [splitMembers, defaultSplitRule, currentMember.displayName]);

  // Dynamic caption for installment block
  const installmentCaption = useMemo(() => {
    if (!isInstallment) return "";
    const curr = typeof installmentCurrent === "number" ? installmentCurrent : 0;
    const tot = typeof installmentTotal === "number" ? installmentTotal : 0;
    return formatInstallmentCaption({
      dueDate: dueDate || defaultDueDate,
      current: curr,
      total: tot,
      amountCents,
    });
  }, [isInstallment, installmentCurrent, installmentTotal, dueDate, defaultDueDate, amountCents]);

  const validateForm = (): boolean => {
    const nextErrors = validateExpenseForm({
      description,
      amountCents,
      dueDate,
      categoryId,
      isInstallment,
      installmentCurrent,
      installmentTotal,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const executeSave = (scope: "esta" | "proximas" = "esta", submitType: "saveAndClose" | "saveAndNew" = "saveAndClose") => {
    setServerError(null);
    setSuccessMessage(null);

    const month = dueDate.slice(0, 7);

    const payload: SaveExpenseInput = {
      id: isEdit ? initialExpense?.id : undefined,
      month,
      description: description.trim(),
      amountCents: amountCents!,
      categoryId,
      ownerMemberId,
      paymentMethodId: paymentMethodId || null,
      dueDate,
      paid: isPaid,
      paidByMemberId: isPaid ? (paidByMemberId || currentMember.id) : null,
      installment: isInstallment
        ? {
            current: Number(installmentCurrent),
            total: Number(installmentTotal),
          }
        : null,
      recurring: isRecurring,
      notes: notes.trim() || null,
      scope,
    };

    startTransition(async () => {
      try {
        const result = await saveExpense(payload, scope);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }

        if (submitType === "saveAndNew") {
          setSuccessMessage("Despesa lançada com sucesso! Você pode lançar outra.");
          setDescription("");
          setAmountCents(null);
          setNotes("");
          setIsInstallment(false);
          setIsRecurring(false);
          setErrors({});
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          router.push(`/despesas?mes=${month}`);
        }
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Ocorreu um erro ao salvar a despesa.");
      }
    });
  };

  const handleSaveClick = (submitType: "saveAndClose" | "saveAndNew") => {
    if (!validateForm()) return;

    if (isEdit && isSequence) {
      setModalAction("save");
      setPendingSubmitType(submitType);
      setModalOpen(true);
    } else {
      executeSave("esta", submitType);
    }
  };

  const handleDeleteClick = () => {
    setModalAction("delete");
    setModalOpen(true);
  };

  const executeDelete = (scope: "esta" | "proximas" = "esta") => {
    if (!initialExpense?.id) return;
    setServerError(null);

    const month = dueDate.slice(0, 7);

    startTransition(async () => {
      try {
        const result = await deleteExpense(initialExpense.id, scope);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        router.push(`/despesas?mes=${month}`);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Ocorreu um erro ao excluir a despesa.");
      }
    });
  };

  const handleModalConfirm = (scope: "esta" | "proximas") => {
    setModalOpen(false);
    if (modalAction === "save") {
      executeSave(scope, pendingSubmitType);
    } else {
      executeDelete(scope);
    }
  };

  const backHref = `/despesas?mes=${effectiveMonth}`;

  return (
    <>
      <div className="cc-top cc-hide-sm">
        <div className="cc-top__titles">
          <Link href={backHref} className="label" style={{ textDecoration: "none" }}>
            ← Despesas
          </Link>
          <h1 className="heading">{isEdit ? "Editar despesa" : "Lançar despesa"}</h1>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--danger-subtle, #fde8e8)",
            borderRadius: "var(--radius-md, 8px)",
            marginBottom: "var(--space-3)",
          }}
        >
          {serverError}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            color: "var(--brand-ink, #28372d)",
            backgroundColor: "var(--surface-sunken, #edeae2)",
            borderRadius: "var(--radius-md, 8px)",
            marginBottom: "var(--space-3)",
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}

      {!canEdit && (
        <div
          role="alert"
          className="cc-field__hint"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--surface-sunken, #edeae2)",
            borderRadius: "var(--radius-md, 8px)",
            marginBottom: "var(--space-3)",
          }}
        >
          Você só tem permissão para visualizar esta despesa. Apenas o responsável ou administradores podem editá-la.
        </div>
      )}

      <form
        className="cc-card"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveClick("saveAndClose");
        }}
      >
        <div className="cc-form">
          <label className="cc-field cc-field--full" htmlFor={descId}>
            <span className="cc-field__label">Descrição</span>
            <span className={cx("cc-input", errors.description && "cc-input--error")}>
              <input
                id={descId}
                className="cc-input__text"
                value={description}
                disabled={!canEdit || isSubmitting}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="Ex.: Parcela do carro"
              />
            </span>
            {errors.description && (
              <span className="cc-field__hint cc-field__hint--error" role="alert">
                {errors.description}
              </span>
            )}
          </label>

          <MoneyInput
            label="Valor"
            value={amountCents}
            disabled={!canEdit || isSubmitting}
            hint="Valor de cada parcela."
            error={errors.amount}
            onChange={(cents) => {
              setAmountCents(cents);
              if (errors.amount) {
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }
            }}
          />

          <label className="cc-field" htmlFor={dateId}>
            <span className="cc-field__label">Vencimento</span>
            <span className={cx("cc-input", errors.dueDate && "cc-input--error")}>
              <input
                id={dateId}
                className="cc-input__text"
                type="date"
                value={dueDate}
                disabled={!canEdit || isSubmitting}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) {
                    setErrors((prev) => ({ ...prev, dueDate: undefined }));
                  }
                }}
              />
            </span>
            {errors.dueDate && (
              <span className="cc-field__hint cc-field__hint--error" role="alert">
                {errors.dueDate}
              </span>
            )}
          </label>
        </div>

        <fieldset
          style={{
            border: 0,
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <legend className="cc-field__label" style={{ marginBottom: 8 }}>
            Tipo de despesa
          </legend>
          <div className="cc-filters" role="radiogroup" aria-label="Tipo de despesa">
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                color={cat.color}
                pressed={categoryId === cat.id}
                disabled={!canEdit || isSubmitting}
                style={{ minHeight: "40px" }}
                onClick={() => {
                  setCategoryId(cat.id);
                  if (errors.categoryId) {
                    setErrors((prev) => ({ ...prev, categoryId: undefined }));
                  }
                }}
              >
                {cat.name}
              </CategoryChip>
            ))}
            <Link
              className="cc-chip"
              href="/tipos"
              style={{
                textDecoration: "none",
                color: "var(--brand-ink)",
                minHeight: "40px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              + Novo tipo
            </Link>
          </div>
          {errors.categoryId && (
            <span className="cc-field__hint cc-field__hint--error" role="alert">
              {errors.categoryId}
            </span>
          )}
        </fieldset>

        <div className="cc-form">
          <div className="cc-field cc-field--full">
            <span className="cc-field__label">De quem é a despesa</span>
            <div className="cc-filters" role="group" aria-label="Dono da despesa">
              {members.map((m) => {
                const isSelected = ownerMemberId === m.id;
                const isYou = m.id === currentMember.id;
                const isMemberRestricted = currentMember.role === "membro" && !isYou;

                return (
                  <button
                    key={m.id}
                    type="button"
                    className="cc-chip"
                    aria-pressed={isSelected}
                    disabled={!canEdit || isSubmitting || isMemberRestricted}
                    title={isMemberRestricted ? "Disponível para administrador ou dono" : undefined}
                    style={{ minHeight: "40px" }}
                    onClick={() => setOwnerMemberId(m.id)}
                  >
                    <MemberAvatar name={m.displayName} color={m.color} />
                    {m.displayName}{isYou ? " (você)" : ""}
                  </button>
                );
              })}

              <button
                type="button"
                className="cc-chip"
                aria-pressed={ownerMemberId === null}
                disabled={!canEdit || isSubmitting}
                style={{ minHeight: "40px" }}
                onClick={() => setOwnerMemberId(null)}
              >
                <MemberAvatar name="Família" color="family" />
                Família (dividir)
              </button>
            </div>
            <span className="cc-field__hint">
              {ownerMemberId === null
                ? familyHint
                : `Despesa individual de ${
                    members.find((m) => m.id === ownerMemberId)?.displayName ?? "membro"
                  }. Lançado por ${currentMember.displayName}.`}
            </span>
          </div>

          <label className="cc-field">
            <span className="cc-field__label">Forma de pagamento</span>
            <select
              className="cc-select"
              style={{ height: 44 }}
              disabled={!canEdit || isSubmitting}
              value={paymentMethodId ?? ""}
              onChange={(e) => setPaymentMethodId(e.target.value || null)}
            >
              <option value="">Boleto / Pix</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </label>

          <div className="cc-field">
            <span className="cc-field__label">Status</span>
            <SegmentedControl
              options={[
                { value: "pendente", label: "Pendente" },
                { value: "pago", label: "Pago" },
              ]}
              value={isPaid ? "pago" : "pendente"}
              disabled={!canEdit || isSubmitting}
              onChange={(val) => {
                const paid = val === "pago";
                setIsPaid(paid);
                if (paid && !paidByMemberId) {
                  setPaidByMemberId(currentMember.id);
                }
              }}
              label="Status"
            />
          </div>

          <label className="cc-field">
            <span className="cc-field__label">Quem pagou (quando pago)</span>
            <select
              className="cc-select"
              style={{ height: 44 }}
              disabled={!canEdit || isSubmitting || !isPaid}
              value={paidByMemberId ?? ""}
              onChange={(e) => setPaidByMemberId(e.target.value || null)}
            >
              <option value="" disabled={isPaid}>
                {isPaid ? "Selecione quem pagou" : "Disponível quando pago"}
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}{m.id === currentMember.id ? " (você)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="cc-card"
          style={{
            background: "var(--surface-sunken)",
            border: 0,
            boxShadow: "none",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <label
            className="cc-check"
            style={{ minHeight: "40px", cursor: !canEdit ? "default" : "pointer" }}
          >
            <input
              type="checkbox"
              checked={isInstallment}
              disabled={!canEdit || isSubmitting}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsInstallment(checked);
                if (checked) {
                  setIsRecurring(false);
                }
              }}
            />
            Compra parcelada
          </label>

          {isInstallment && (
            <>
              <div className="cc-form">
                <label className="cc-field">
                  <span className="cc-field__label">Parcela atual</span>
                  <span className={cx("cc-input", errors.installmentCurrent && "cc-input--error")}>
                    <input
                      className="cc-input__text"
                      inputMode="numeric"
                      value={installmentCurrent}
                      disabled={!canEdit || isSubmitting}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setInstallmentCurrent(isNaN(val) ? "" : Math.max(1, val));
                        if (errors.installmentCurrent) {
                          setErrors((prev) => ({ ...prev, installmentCurrent: undefined }));
                        }
                      }}
                    />
                  </span>
                  {errors.installmentCurrent && (
                    <span className="cc-field__hint cc-field__hint--error" role="alert">
                      {errors.installmentCurrent}
                    </span>
                  )}
                </label>

                <label className="cc-field">
                  <span className="cc-field__label">Total de parcelas</span>
                  <span className={cx("cc-input", errors.installmentTotal && "cc-input--error")}>
                    <input
                      className="cc-input__text"
                      inputMode="numeric"
                      value={installmentTotal}
                      disabled={!canEdit || isSubmitting}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setInstallmentTotal(isNaN(val) ? "" : Math.max(1, val));
                        if (errors.installmentTotal) {
                          setErrors((prev) => ({ ...prev, installmentTotal: undefined }));
                        }
                      }}
                    />
                  </span>
                  {errors.installmentTotal && (
                    <span className="cc-field__hint cc-field__hint--error" role="alert">
                      {errors.installmentTotal}
                    </span>
                  )}
                </label>
              </div>

              {installmentCaption && (
                <span className="caption cc-muted">{installmentCaption}</span>
              )}
            </>
          )}

          <label
            className="cc-check"
            style={{ minHeight: "40px", cursor: !canEdit ? "default" : "pointer" }}
          >
            <input
              type="checkbox"
              checked={isRecurring}
              disabled={!canEdit || isSubmitting}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsRecurring(checked);
                if (checked) {
                  setIsInstallment(false);
                }
              }}
            />
            Repetir todo mês (despesa recorrente)
          </label>
        </div>

        <label className="cc-field cc-field--full" htmlFor={notesId}>
          <span className="cc-field__label">Observação (opcional)</span>
          <span className="cc-input">
            <input
              id={notesId}
              className="cc-input__text"
              value={notes}
              disabled={!canEdit || isSubmitting}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: inclui seguro"
              maxLength={500}
            />
          </span>
        </label>

        <div className="cc-formfoot cc-actions--wide">
          {isEdit && canDelete && (
            <button
              type="button"
              className="cc-btn cc-btn--danger"
              style={{ marginRight: "auto", minHeight: "40px" }}
              disabled={isSubmitting}
              onClick={handleDeleteClick}
            >
              Excluir despesa
            </button>
          )}

          <Link
            className="cc-btn cc-btn--secondary"
            href={backHref}
            style={{ textDecoration: "none", minHeight: "40px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Cancelar
          </Link>

          {!isEdit && (
            <button
              type="button"
              className="cc-btn cc-btn--secondary cc-hide-sm"
              style={{ minHeight: "40px" }}
              disabled={!canEdit || isSubmitting}
              onClick={() => handleSaveClick("saveAndNew")}
            >
              {isSubmitting ? "Salvando…" : "Salvar e lançar outra"}
            </button>
          )}

          <button
            type="submit"
            className="cc-btn cc-btn--primary"
            style={{ minHeight: "40px" }}
            disabled={!canEdit || isSubmitting}
          >
            {isSubmitting
              ? isEdit
                ? "Salvando…"
                : "Lançando…"
              : isEdit
              ? "Salvar despesa"
              : "Lançar despesa"}
          </button>
        </div>
      </form>

      <ScopeModal
        isOpen={modalOpen}
        actionType={modalAction}
        isSequence={isSequence}
        isPending={isSubmitting}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
