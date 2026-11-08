import { createHash, randomBytes } from "node:crypto";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken(): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

export function inviteLink(token: string): string {
  const baseUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${baseUrl}/convite/${token}`;
}
