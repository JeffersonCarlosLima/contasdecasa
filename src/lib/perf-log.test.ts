import { afterEach, describe, expect, it, vi } from "vitest";
import { timeQuery } from "./perf-log";

describe("timeQuery", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("registra consultas acima do limite e devolve o resultado", async () => {
    vi.stubEnv("SLOW_QUERY_MS", "10");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const r = await timeQuery("select   1", () => new Promise((res) => setTimeout(() => res(42), 30)));
    expect(r).toBe(42);
    expect(warn).toHaveBeenCalledOnce();
    expect(JSON.parse(warn.mock.calls[0]![0] as string)).toMatchObject({ perf: "slow-query", sql: "select 1" });
  });

  it("não registra consultas rápidas nem quando desativado", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await timeQuery("select 1", async () => 1);
    vi.stubEnv("SLOW_QUERY_MS", "0");
    await timeQuery("select 1", () => new Promise((res) => setTimeout(res, 20)));
    expect(warn).not.toHaveBeenCalled();
  });
});
