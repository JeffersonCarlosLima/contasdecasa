"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button, Field, SegmentedControl } from "@/components/ui";

export function isValidInviteToken(token?: string | null): token is string {
  if (!token) return false;
  return /^[A-Za-z0-9_-]+$/.test(token);
}

export interface AuthFormProps {
  mode: "entrar" | "cadastro";
  inviteToken?: string;
}

export function AuthForm({ mode, inviteToken }: AuthFormProps) {
  const router = useRouter();

  const validToken = isValidInviteToken(inviteToken) ? inviteToken : null;
  const targetUrl = validToken ? `/convite/${validToken}` : "/";
  const conviteQuery = validToken ? `?convite=${encodeURIComponent(validToken)}` : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "entrar") {
        const res = await authClient.signIn.email({
          email,
          password,
          rememberMe,
        });

        if (res?.error) {
          if (res.error.status === 429) {
            setError("Muitas tentativas. Aguarde um minuto e tente de novo.");
          } else {
            setError("Email ou senha incorretos. Confira e tente de novo.");
          }
          setLoading(false);
          return;
        }

        router.push(targetUrl);
      } else {
        const res = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (res?.error) {
          if (res.error.status === 429) {
            setError("Muitas tentativas. Aguarde um minuto e tente de novo.");
          } else {
            // shortcut: texto de erro do cadastro pendente de definição do Jefferson
            setError("Email ou senha incorretos. Confira e tente de novo.");
          }
          setLoading(false);
          return;
        }

        router.push(targetUrl);
      }
    } catch (err: unknown) {
      const maybeStatus = (err as { status?: number; statusCode?: number })?.status ??
        (err as { status?: number; statusCode?: number })?.statusCode;

      if (maybeStatus === 429) {
        setError("Muitas tentativas. Aguarde um minuto e tente de novo.");
      } else {
        setError("Email ou senha incorretos. Confira e tente de novo.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <SegmentedControl
        label="Acesso"
        options={[
          { value: "entrar", label: "Entrar" },
          { value: "cadastro", label: "Criar conta" },
        ]}
        value={mode}
        onChange={(val) => {
          if (val !== mode) {
            router.push(val === "entrar" ? `/entrar${conviteQuery}` : `/cadastro${conviteQuery}`);
          }
        }}
        style={{ alignSelf: "flex-start" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="heading">
          {mode === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}
        </h1>
        <span className="body cc-muted">
          {mode === "entrar"
            ? "Entre com o email e a senha que você cadastrou."
            : "Cadastre-se para gerenciar as contas da sua família."}
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mode === "cadastro" && (
          <Field
            label="Seu nome"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            required
          />
        )}

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          autoComplete="email"
          required
        />

        <Field
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          required
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <label className="cc-check" style={{ minHeight: "40px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Manter conectado
          </label>

          {mode === "entrar" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="label"
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  minHeight: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                  color: "inherit",
                }}
                onClick={() => setShowForgotNotice(true)}
              >
                Esqueci a senha
              </button>
              {showForgotNotice && (
                <span className="caption cc-muted" role="status">
                  Em breve
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ height: 46 }}
        >
          {loading
            ? "Entrando…"
            : mode === "entrar"
              ? "Entrar"
              : "Criar conta"}
        </Button>
      </form>

      <div
        className="cc-card"
        style={{
          background: "var(--surface-sunken)",
          border: 0,
          boxShadow: "none",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span className="label">Recebeu um convite?</span>
        <span className="caption cc-muted">
          Crie sua conta com o mesmo email do convite e você entra direto na família que te convidou.
        </span>
      </div>

      {mode === "entrar" ? (
        <span className="body cc-muted">
          Primeira vez aqui?{" "}
          <Link href={`/cadastro${conviteQuery}`}>
            <strong>Crie sua conta e sua família</strong>
          </Link>
        </span>
      ) : (
        <span className="body cc-muted">
          Já tem uma conta?{" "}
          <Link href={`/entrar${conviteQuery}`}>
            <strong>Entrar</strong>
          </Link>
        </span>
      )}
    </>
  );
}
