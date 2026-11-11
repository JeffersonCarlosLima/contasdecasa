"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { buildWhatsAppInviteUrl } from "./helpers";

interface InviteLinkModalProps {
  isOpen: boolean;
  link: string;
  familyName?: string;
  onClose: () => void;
}

export function InviteLinkModal({
  isOpen,
  link,
  familyName = "família",
  onClose,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const whatsappUrl = buildWhatsAppInviteUrl(familyName, link);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link do convite gerado">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p className="body cc-muted" style={{ margin: 0 }}>
          O convite foi criado com sucesso e é válido por <strong>7 dias</strong>. Como o envio automático
          de email é opcional, você pode copiar o link abaixo e enviar diretamente por WhatsApp, mensagem
          ou email para a pessoa.
        </p>

        <label className="cc-field">
          <span className="cc-field__label">Link de acesso</span>
          <span className="cc-input">
            <input
              className="cc-input__text"
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
            />
          </span>
        </label>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn cc-btn--secondary"
            style={{ textDecoration: "none" }}
          >
            Enviar pelo WhatsApp
          </a>
          <Button type="button" variant="primary" onClick={handleCopy} aria-live="polite">
            {copied ? "Link copiado!" : "Copiar link"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
