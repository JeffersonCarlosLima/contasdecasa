import { afterEach, describe, expect, it, vi } from "vitest";
import * as net from "node:net";
import { sendEmail } from "./mail";

describe("sendEmail", () => {
  const servers: net.Server[] = [];
  afterEach(() => {
    vi.unstubAllEnvs();
    for (const s of servers.splice(0)) s.close();
  });

  it("devolve erro por tempo esgotado quando o SMTP não responde", async () => {
    // Servidor que aceita a conexão e nunca fala.
    const server = net.createServer(() => {});
    servers.push(server);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const { port } = server.address() as net.AddressInfo;

    vi.stubEnv("SMTP_HOST", "127.0.0.1");
    vi.stubEnv("SMTP_PORT", String(port));
    vi.stubEnv("SMTP_USER", "u@x.com");
    vi.stubEnv("SMTP_PASS", "p");
    vi.stubEnv("SMTP_TIMEOUT_MS", "200");

    const started = Date.now();
    const result = await sendEmail({ to: "a@b.com", subject: "s", text: "t" });

    expect(result.sent).toBe(false);
    expect(result.error).toMatch(/Tempo esgotado/);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
