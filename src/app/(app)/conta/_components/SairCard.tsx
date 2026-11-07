"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui";

export function SairCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      router.push("/entrar");
    } catch {
      window.location.href = "/entrar";
    }
  };

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 className="title">Sair</h2>
      <p className="body cc-muted" style={{ margin: 0 }}>
        Encerre sua sessão neste dispositivo.
      </p>
      <div>
        <Button variant="secondary" onClick={handleSignOut} disabled={loading}>
          {loading ? "Saindo…" : "Sair"}
        </Button>
      </div>
    </section>
  );
}
