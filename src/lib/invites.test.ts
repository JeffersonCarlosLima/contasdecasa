import { describe, expect, it } from "vitest";
import { createInviteToken, hashInviteToken, inviteLink } from "./invites";

describe("invites", () => {
  it("hashInviteToken produz sha256 consistente", () => {
    const token = "teste-token-123";
    const hash1 = hashInviteToken(token);
    const hash2 = hashInviteToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hashInviteToken("outro-token")).not.toBe(hash1);
  });

  it("createInviteToken gera token, hash e expiração em 7 dias", () => {
    const before = Date.now();
    const { token, tokenHash, expiresAt } = createInviteToken();
    const after = Date.now();

    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(tokenHash).toBe(hashInviteToken(token));

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  it("inviteLink monta a URL usando APP_URL", () => {
    const originalEnv = process.env.APP_URL;
    process.env.APP_URL = "https://app.contasdacasa.com.br";

    try {
      expect(inviteLink("abc123token")).toBe(
        "https://app.contasdacasa.com.br/convite/abc123token",
      );
    } finally {
      process.env.APP_URL = originalEnv;
    }
  });

  it("inviteLink remove barra final de APP_URL se houver", () => {
    const originalEnv = process.env.APP_URL;
    process.env.APP_URL = "https://app.contasdacasa.com.br/";

    try {
      expect(inviteLink("abc123token")).toBe(
        "https://app.contasdacasa.com.br/convite/abc123token",
      );
    } finally {
      process.env.APP_URL = originalEnv;
    }
  });
});
