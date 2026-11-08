"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { acceptInvite } from "../actions";

interface AcceptInviteButtonProps {
  token: string;
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvite(token);
      if (res && !res.ok) {
        setError(res.error);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      <Button
        type="button"
        variant="primary"
        onClick={handleAccept}
        disabled={isPending}
        style={{ width: "100%" }}
      >
        {isPending ? "Entrando na família..." : "Entrar na família"}
      </Button>
      {error && (
        <span className="cc-field__hint cc-field__hint--error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
