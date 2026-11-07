import Link from "next/link";
import { AcceptInviteButton } from "./AcceptInviteButton";
import {
  EXPIRED_INVITE_MESSAGE,
  getCadastroLink,
  getEntrarLink,
  getInviteHeading,
  getInviteSupportText,
  isEmailMatch,
} from "./helpers";

export interface InviteData {
  familyName: string;
  invitedByName: string;
  email: string;
}

interface InviteContentProps {
  token: string;
  inviteData: InviteData | null;
  sessionEmail: string | null;
}

export function InviteContent({ token, inviteData, sessionEmail }: InviteContentProps) {
  if (!inviteData) {
    return (
      <div
        className="cc-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h1 className="heading">Convite indisponível</h1>
          <p className="body cc-muted" style={{ margin: 0 }}>
            {EXPIRED_INVITE_MESSAGE}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Link
            className="cc-btn cc-btn--secondary"
            href="/entrar"
            style={{ textDecoration: "none", width: "100%", boxSizing: "border-box" }}
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  const isEmailMatching = isEmailMatch(sessionEmail, inviteData.email);

  return (
    <div
      className="cc-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h1 className="heading">{getInviteHeading(inviteData.familyName)}</h1>
        <p className="body cc-muted" style={{ margin: 0 }}>
          {getInviteSupportText(inviteData.invitedByName, inviteData.email)}
        </p>
      </div>

      {sessionEmail ? (
        isEmailMatching ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p className="caption cc-muted" style={{ margin: 0 }}>
              Você já está conectado como <strong>{sessionEmail}</strong>. Clique abaixo para entrar
              na família e acessar as contas da casa.
            </p>
            <AcceptInviteButton token={token} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                padding: "var(--space-3)",
                background: "var(--pending-soft)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p className="body" style={{ color: "var(--pending)", margin: 0, fontSize: "14px" }}>
                Você está conectado como <strong>{sessionEmail}</strong>, mas este convite foi
                enviado para <strong>{inviteData.email}</strong>.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                className="cc-btn cc-btn--primary"
                href={getEntrarLink(inviteData.email)}
                style={{ textDecoration: "none", width: "100%", boxSizing: "border-box" }}
              >
                Entrar com o email do convite
              </Link>
              <Link
                className="cc-btn cc-btn--secondary"
                href={getCadastroLink(inviteData.email)}
                style={{ textDecoration: "none", width: "100%", boxSizing: "border-box" }}
              >
                Criar conta com este email
              </Link>
            </div>
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link
            className="cc-btn cc-btn--primary"
            href={getCadastroLink(inviteData.email)}
            style={{ textDecoration: "none", width: "100%", boxSizing: "border-box" }}
          >
            Criar conta
          </Link>
          <Link
            className="cc-btn cc-btn--secondary"
            href={getEntrarLink(inviteData.email)}
            style={{ textDecoration: "none", width: "100%", boxSizing: "border-box" }}
          >
            Já tenho conta
          </Link>
        </div>
      )}
    </div>
  );
}
