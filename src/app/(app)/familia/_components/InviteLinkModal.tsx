"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";

interface InviteLinkModalProps {
  isOpen: boolean;
  link: string;
  onClose: () => void;
}

export function InviteLinkModal({ isOpen, link, onClose }: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);

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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

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

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" variant="primary" onClick={handleCopy}>
            {copied ? "Link copiado!" : "Copiar link"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
