"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import {
  removeMember,
  transferOwnership,
  updateMember,
} from "@/app/(app)/familia/actions";
import {
  COLOR_OPTIONS,
  type FamilyMemberItem,
} from "./types";
import type { MemberRole } from "@/lib/session";

interface EditMemberModalProps {
  isOpen: boolean;
  member: FamilyMemberItem | null;
  currentUserRole: MemberRole;
  currentMemberId: string;
  isSplitPersonalizada?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMemberModal({
  isOpen,
  member,
  currentUserRole,
  currentMemberId,
  isSplitPersonalizada = false,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "membro">("membro");
  const [kinship, setKinship] = useState<"titular" | "conjuge" | "filho" | "outro">("outro");
  const [color, setColor] = useState<PersonColor>("person-a");
  const [participatesInSplit, setParticipatesInSplit] = useState(true);
  const [customPercentStr, setCustomPercentStr] = useState("");

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (member) {
      setDisplayName(member.displayName);
      setRole(member.role === "admin" ? "admin" : "membro");
      setKinship(member.kinship);
      setColor(member.color as PersonColor);
      setParticipatesInSplit(member.participatesInSplit);
      setCustomPercentStr(
        member.customPercent != null ? (member.customPercent / 100).toString() : "",
      );
      setConfirmRemove(false);
      setConfirmTransfer(false);
      setError(null);
    }
  }, [member]);

  if (!member) return null;

  const isSelf = member.id === currentMemberId;
  const isTargetOwner = member.role === "dono";
  const isTargetDependent = !member.userId;
  const isCurrentOwner = currentUserRole === "dono";

  // Pode alterar o papel? Dono nunca pode ter papel alterado aqui (só transferência);
  // Admin só pode alterar papel de membro se não for outro admin.
  const canChangeRole =
    !isTargetOwner &&
    !isTargetDependent &&
    (isCurrentOwner || (currentUserRole === "admin" && member.role === "membro"));

  // Pode remover? Dono não pode ser removido; usuário não remove a si mesmo;
  // Admin não remove outro admin.
  const canRemove =
    !isTargetOwner &&
    !isSelf &&
    (isCurrentOwner || (currentUserRole === "admin" && member.role !== "admin"));

  // Pode transferir posse? Só dono para outro membro ativo com login
  const canTransfer =
    isCurrentOwner && !isSelf && !isTargetDependent && member.status === "ativo";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedPercent: number | null | undefined = undefined;
    if (isSplitPersonalizada) {
      if (customPercentStr.trim() === "") {
        parsedPercent = null;
      } else {
        const num = parseFloat(customPercentStr.replace(",", "."));
        if (isNaN(num) || num < 0 || num > 100) {
          setError("Informe um percentual válido entre 0% e 100%.");
          return;
        }
        parsedPercent = Math.round(num * 100); // Converte para pontos-base (50% -> 5000)
      }
    }

    startTransition(async () => {
      const trimmedName = displayName.trim();
      const res = await updateMember(member.id, {
        ...(trimmedName && trimmedName !== member.displayName ? { displayName: trimmedName } : {}),
        ...(canChangeRole ? { role } : {}),
        color,
        kinship,
        participatesInSplit,
        ...(isSplitPersonalizada ? { customPercent: parsedPercent } : {}),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      onSuccess();
      onClose();
    });
  };

  const handleRemove = () => {
    setError(null);
    startTransition(async () => {
      const res = await removeMember(member.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
      onClose();
    });
  };

  const handleTransfer = () => {
    setError(null);
    startTransition(async () => {
      const res = await transferOwnership(member.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar ${member.displayName}`}>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Nome de exibição */}
        <label className="cc-field">
          <span className="cc-field__label">Nome de exibição</span>
          <span className="cc-input">
            <input
              className="cc-input__text"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isPending}
              required
            />
          </span>
          {member.email && <span className="cc-field__hint">{member.email}</span>}
        </label>

        {/* Papel */}
        <label className="cc-field">
          <span className="cc-field__label">Papel na família</span>
          {isTargetOwner ? (
            <span className="cc-input">
              <input
                className="cc-input__text"
                type="text"
                value="Dono da família"
                disabled
              />
            </span>
          ) : isTargetDependent ? (
            <span className="cc-input">
              <input
                className="cc-input__text"
                type="text"
                value="Dependente (sem login)"
                disabled
              />
            </span>
          ) : (
            <select
              className="cc-select"
              style={{ height: "44px" }}
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "membro")}
              disabled={!canChangeRole || isPending}
            >
              <option value="membro">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          )}
          {!canChangeRole && !isTargetOwner && !isTargetDependent && (
            <span className="cc-field__hint">
              Apenas o dono da família pode alterar o papel de um administrador.
            </span>
          )}
        </label>

        {/* Parentesco */}
        <label className="cc-field">
          <span className="cc-field__label">Parentesco</span>
          <select
            className="cc-select"
            style={{ height: "44px" }}
            value={kinship}
            onChange={(e) => setKinship(e.target.value as "titular" | "conjuge" | "filho" | "outro")}
            disabled={isPending}
          >
            <option value="titular">Titular</option>
            <option value="conjuge">Cônjuge</option>
            <option value="filho">Filho(a)</option>
            <option value="outro">Outro parente</option>
          </select>
        </label>

        {/* Cor do membro */}
        <div className="cc-field">
          <span className="cc-field__label">Cor do membro</span>
          <div
            role="group"
            aria-label="Cor do membro"
            style={{
              display: "flex",
              gap: "12px",
              paddingTop: "4px",
              alignItems: "center",
            }}
          >
            {COLOR_OPTIONS.map((opt) => {
              const isSelected = color === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  disabled={isPending}
                  aria-label={opt.label}
                  aria-pressed={isSelected}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                    borderRadius: "var(--radius-full)",
                    border: isSelected
                      ? "2px solid var(--brand)"
                      : "2px solid transparent",
                    background: isSelected ? "var(--brand-soft)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <MemberAvatar
                    name={member.displayName}
                    color={opt.value}
                    size="md"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Participa da divisão */}
        <label className="cc-check" style={{ minHeight: "40px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={participatesInSplit}
            onChange={(e) => setParticipatesInSplit(e.target.checked)}
            disabled={isPending}
          />
          Participa da divisão das despesas da família
        </label>

        {/* Percentual personalizado (se regra for personalizada) */}
        {isSplitPersonalizada && (
          <label className="cc-field">
            <span className="cc-field__label">Percentual na divisão (%)</span>
            <span className="cc-input">
              <input
                className="cc-input__text"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ex.: 50"
                value={customPercentStr}
                onChange={(e) => setCustomPercentStr(e.target.value)}
                disabled={isPending}
              />
            </span>
            <span className="cc-field__hint">
              Utilizado na regra de divisão personalizada (0 a 100%).
            </span>
          </label>
        )}

        {error && (
          <span className="cc-field__hint cc-field__hint--error" role="alert">
            {error}
          </span>
        )}

        {/* Confirmação de Transferência de Posse */}
        {confirmTransfer && (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--surface-sunken)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span className="body" style={{ fontSize: "14px", fontWeight: 500 }}>
              Transferir a posse da família para <strong>{member.displayName}</strong>?
            </span>
            <span className="caption cc-muted">
              Você deixará de ser o Dono e passará a ser Administrador. O novo Dono terá controle total
              sobre a família, podendo excluir ou transferir a posse.
            </span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmTransfer(false)}
                disabled={isPending}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleTransfer}
                disabled={isPending}
              >
                {isPending ? "Transferindo..." : "Confirmar transferência"}
              </Button>
            </div>
          </div>
        )}

        {/* Confirmação de Remoção de Membro */}
        {confirmRemove && (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--danger-soft)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span className="body" style={{ color: "var(--danger)", fontSize: "14px", fontWeight: 600 }}>
              Remover este membro da família?
            </span>
            <span className="caption" style={{ color: "var(--ink)" }}>
              As despesas já cadastradas continuarão no histórico e ficarão marcadas como de ex-membro.
              O usuário perderá o acesso à família.
            </span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmRemove(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemove}
                disabled={isPending}
              >
                {isPending ? "Removendo..." : "Confirmar remoção"}
              </Button>
            </div>
          </div>
        )}

        {/* Botões do Rodapé */}
        {!confirmRemove && !confirmTransfer && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "8px",
              paddingTop: "12px",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>

            {(canRemove || canTransfer) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1px dashed var(--line)",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {canTransfer && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmTransfer(true)}
                    disabled={isPending}
                  >
                    Transferir posse
                  </Button>
                )}
                {canRemove && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmRemove(true)}
                    disabled={isPending}
                  >
                    Remover membro
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
