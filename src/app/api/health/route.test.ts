import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from "@/db";
import { dynamic, GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configura rota como force-dynamic", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("retorna 200 e { ok: true } quando o banco responde", async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({ ok: true });
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("retorna 503 e { ok: false } quando o banco falha, sem expor detalhes do erro", async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("Database connection refused"));

    const res = await GET();
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data).toEqual({ ok: false });
    expect(data).not.toHaveProperty("error");
    expect(data).not.toHaveProperty("message");
    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
