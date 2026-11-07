import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/family-join", () => ({
  joinFamilyFromInvite: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(async (cb) => {
      const tx = {};
      return cb(tx);
    }),
  },
}));

import { redirect } from "next/navigation";
import { db } from "@/db";
import { joinFamilyFromInvite } from "@/lib/family-join";
import { requireSession } from "@/lib/session";
import { guardCriarFamilia } from "./guard";

describe("guardCriarFamilia", () => {
  const mockUser = {
    id: "usr_1",
    name: "Jefferson",
    email: "jefferson@exemplo.com",
  };

  const mockSession = {
    user: mockUser,
    session: { id: "sess_1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSession).mockResolvedValue(mockSession as unknown as Awaited<ReturnType<typeof requireSession>>);
  });

  it("redireciona para / se o usuário já possui família ativa", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "mem_ativo" }]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    await expect(guardCriarFamilia()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("aceita convite pendente automaticamente via joinFamilyFromInvite e redireciona para /", async () => {
    const mockInvite = {
      id: "inv_123",
      familyId: "fam_123",
      email: mockUser.email,
      role: "membro" as const,
      kinship: "conjuge" as const,
      participatesInSplit: true,
    };

    vi.mocked(db.select)
      // 1. busca membro ativo -> vazio
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      // 2. busca convite pendente por email -> encontra convite
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockInvite]),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

    await expect(guardCriarFamilia()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
    expect(db.transaction).toHaveBeenCalled();
    expect(joinFamilyFromInvite).toHaveBeenCalledWith(expect.anything(), mockUser, mockInvite);
  });

  it("retorna { ok: true, user } quando usuário não tem família nem convite pendente", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

    const result = await guardCriarFamilia();
    expect(result).toEqual({
      ok: true,
      user: mockUser,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
