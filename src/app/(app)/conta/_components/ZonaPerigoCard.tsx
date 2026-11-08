"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFamily, transferOwnership } from "@/app/(app)/familia/actions";
import { Button } from "@/components/ui";

export interface ZonaPerigoCardProps {
  eligibleMembers: Array<{ id: string; displayName: string }>;
}

export function ZonaPerigoCard({ eligibleMembers }: ZonaPerigoCardProps) {
  const router = useRouter();

  const [targetMemberId, setTargetMemberId] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedMember = eligibleMembers.find((m) => m.id === targetMemberId);

  const handleTransfer = async () => {
    if (!targetMemberId) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await transferOwnership(targetMemberId);
      if (!res.ok) {
        setError(res.error || "Erro ao transferir posse.");
        setLoading(false);
        return;
      }

      setSuccess("Posse transferida com sucesso.");
      setConfirmTransfer(false);
      setTargetMemberId("");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Erro ao transferir posse.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await deleteFamily();
      if (!res.ok) {
        setError(res.error || "Erro ao excluir família.");
        setLoading(false);
        return;
      }

      router.push("/criar-familia");
    } catch (err: unknown) {
      setError((err as Error)?.message || "Erro ao excluir família.");
      setLoading(false);
    }
  };

  return (
    <section
      className="cc-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        borderColor: "var(--danger)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="title" style={{ color: "var(--danger)" }}>
          Zona de perigo
        </h2>
        <span className="caption cc-muted">
          Ações restritas ao dono da família com impacto permanente.
        </span>
      </div>

      {error && (
        <div role="alert" className="cc-field__hint cc-field__hint--error">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="caption" style={{ color: "var(--invest)", fontWeight: 500 }}>
          {success}
        </div>
      )}

      {/* Transferir posse */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="label" style={{ fontWeight: 600 }}>
            Transferir posse
          </span>
          <span className="caption cc-muted">
            Transfira a administração principal da família para outro membro ativo com login.
          </span>
        </div>

        {eligibleMembers.length === 0 ? (
          <span className="caption cc-muted">
            Não há outros membros ativos com login disponíveis para transferência.
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select
                className="cc-select"
                style={{ height: "44px" }}
                value={targetMemberId}
                onChange={(e) => {
                  setTargetMemberId(e.target.value);
                  setConfirmTransfer(false);
                }}
                disabled={loading}
                aria-label="Selecionar novo dono"
              >
                <option value="">Selecione o novo dono…</option>
                {eligibleMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>

              {!confirmTransfer && (
                <Button
                  variant="danger"
                  disabled={!targetMemberId || loading}
                  onClick={() => setConfirmTransfer(true)}
                >
                  Transferir posse
                </Button>
              )}
            </div>

            {confirmTransfer && selectedMember && (
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
                  Transferir a posse da família para <strong>{selectedMember.displayName}</strong>?
                </span>
                <span className="caption cc-muted">
                  Você deixará de ser o Dono e passará a ser Administrador.
                </span>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmTransfer(false)}
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleTransfer}
                    disabled={loading}
                  >
                    {loading ? "Transferindo…" : "Confirmar transferência"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Excluir família */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="label" style={{ fontWeight: 600, color: "var(--danger)" }}>
            Excluir família
          </span>
          <span className="caption cc-muted">
            Exclui permanentemente a família, seus membros, categorias e todas as despesas lançadas.
          </span>
        </div>

        {!confirmDelete ? (
          <div>
            <Button
              variant="danger"
              disabled={loading}
              onClick={() => setConfirmDelete(true)}
            >
              Excluir família
            </Button>
          </div>
        ) : (
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
            <span
              className="body"
              style={{ color: "var(--danger)", fontSize: "14px", fontWeight: 600 }}
            >
              Tem certeza de que deseja excluir a família?
            </span>
            <span className="caption cc-muted">
              Esta ação é irreversível. Todas as despesas e informações da família serão apagadas.
            </span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Excluindo…" : "Confirmar exclusão da família"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
