import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const req = (body: string) => new Request("http://x/api/vitals", { method: "POST", body });

describe("POST /api/vitals", () => {
  afterEach(() => vi.restoreAllMocks());

  it("grava uma métrica válida no log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const res = await POST(req(JSON.stringify({ name: "LCP", value: 1234.5, path: "/despesas?mes=2026-11" })));
    expect(res.status).toBe(204);
    expect(JSON.parse(warn.mock.calls[0]![0] as string)).toMatchObject({ perf: "web-vital", name: "LCP", path: "/despesas" });
  });

  it("rejeita corpo inválido ou grande", async () => {
    expect((await POST(req("não é json"))).status).toBe(400);
    expect((await POST(req(JSON.stringify({ name: "XYZ", value: 1, path: "/" })))).status).toBe(400);
    expect((await POST(req("x".repeat(2000)))).status).toBe(413);
  });
});
