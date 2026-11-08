"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field } from "@/components/ui";

export function SenhaCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccess("");

    if (!currentPassword) {
      setFieldErrors({ currentPassword: "A senha atual é obrigatória." });
      return;
    }

    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "A confirmação da nova senha não confere." });
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        const msg = res.error.message || "Erro ao trocar a senha. Confira a senha atual.";
        setFieldErrors({ currentPassword: msg });
        setLoading(false);
        return;
      }

      setSuccess("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Erro ao trocar a senha. Confira a senha atual.";
      setFieldErrors({ currentPassword: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="title">Senha</h2>

      {fieldErrors.general && (
        <div role="alert" className="cc-field__hint cc-field__hint--error">
          {fieldErrors.general}
        </div>
      )}

      {success && (
        <div role="status" className="caption" style={{ color: "var(--invest)", fontWeight: 500 }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field
          label="Senha atual"
          type="password"
          placeholder="Sua senha atual"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (fieldErrors.currentPassword || fieldErrors.general) {
              setFieldErrors((prev) => ({ ...prev, currentPassword: undefined, general: undefined }));
            }
          }}
          error={
            fieldErrors.currentPassword ? (
              <span role="alert">{fieldErrors.currentPassword}</span>
            ) : undefined
          }
          required
        />
        <Field
          label="Nova senha"
          type="password"
          placeholder="Nova senha"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (fieldErrors.newPassword) {
              setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
            }
          }}
          error={
            fieldErrors.newPassword ? (
              <span role="alert">{fieldErrors.newPassword}</span>
            ) : undefined
          }
          required
        />
        <Field
          label="Confirmar nova senha"
          type="password"
          placeholder="Confirme a nova senha"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          error={
            fieldErrors.confirmPassword ? (
              <span role="alert">{fieldErrors.confirmPassword}</span>
            ) : undefined
          }
          required
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Trocando senha…" : "Trocar senha"}
          </Button>
        </div>
      </form>
    </section>
  );
}
