"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field } from "@/components/ui";

export function SenhaCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não confere.");
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
        setError(res.error.message || "Erro ao trocar a senha. Confira a senha atual.");
        setLoading(false);
        return;
      }

      setSuccess("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError((err as Error)?.message || "Erro ao trocar a senha. Confira a senha atual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="title">Senha</h2>

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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field
          label="Senha atual"
          type="password"
          placeholder="Sua senha atual"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Field
          label="Nova senha"
          type="password"
          placeholder="Nova senha"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Field
          label="Confirmar nova senha"
          type="password"
          placeholder="Confirme a nova senha"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
