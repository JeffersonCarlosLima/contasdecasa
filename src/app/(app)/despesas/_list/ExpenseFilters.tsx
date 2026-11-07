"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import type { DisplayStatus } from "@/lib/dates";
import type { ViewMode } from "./types";

export interface ExpenseFiltersProps {
  currentMode: ViewMode;
  currentStatus: DisplayStatus | null;
  currentCategory: string | null;
  currentMember: string | null;
  categories: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; displayName: string; color: string }>;
}

export function ExpenseFilters({
  currentMode,
  currentStatus,
  currentCategory,
  currentMember,
  categories,
  members,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusId = useId();
  const catId = useId();

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "todos") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/despesas?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="cc-filters" style={{ justifyContent: "space-between" }}>
        {/* Controle segmentado Por pessoa | Por data */}
        <div className="cc-seg" role="group" aria-label="Agrupar">
          <button
            type="button"
            aria-pressed={currentMode === "pessoa"}
            onClick={() => updateQuery({ modo: "pessoa" })}
          >
            Por pessoa
          </button>
          <button
            type="button"
            aria-pressed={currentMode === "data"}
            onClick={() => updateQuery({ modo: "data" })}
          >
            Por data
          </button>
        </div>

        {/* Selects: Status e Tipo de despesa */}
        <div className="cc-filters">
          <label
            htmlFor={statusId}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            Status
          </label>
          <select
            id={statusId}
            className="cc-select"
            value={currentStatus ?? ""}
            onChange={(e) => updateQuery({ status: e.target.value || null })}
          >
            <option value="">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>

          <label
            htmlFor={catId}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            Tipo de despesa
          </label>
          <select
            id={catId}
            className="cc-select"
            value={currentCategory ?? ""}
            onChange={(e) => updateQuery({ tipo: e.target.value || null })}
          >
            <option value="">Todos os tipos</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha 2: chips de membros */}
      <div className="cc-filters" role="group" aria-label="Membros">
        <button
          type="button"
          className="cc-chip"
          aria-pressed={!currentMember || currentMember === "todos"}
          onClick={() => updateQuery({ membro: null })}
        >
          Todos
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            className="cc-chip"
            aria-pressed={currentMember === m.id}
            onClick={() => updateQuery({ membro: m.id })}
          >
            <MemberAvatar
              name={m.displayName}
              color={m.color as PersonColor}
              size="md"
            />
            {m.displayName}
          </button>
        ))}
        <button
          type="button"
          className="cc-chip"
          aria-pressed={currentMember === "familia"}
          onClick={() => updateQuery({ membro: "familia" })}
        >
          <MemberAvatar color="family" name="Família" size="md" />
          Família
        </button>
      </div>
    </div>
  );
}
