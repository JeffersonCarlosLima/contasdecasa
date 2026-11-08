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

vi.mock("@/lib/invites", () => ({
  createInviteToken: vi.fn(() => ({
    token: "tok_teste",
    tokenHash: "hash_tok_teste",
    expiresAt: new Date(Date.now() + 7 * 86400000),
  })),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(async (cb) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "new_id_123" }]),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      return cb(tx);
    }),
  },
}));

import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireSession } from "@/lib/session";
import { createFamily } from "./actions";

describe("criar-familia actions", () => {
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

  describe("createFamily", () => {
    it("rejeita dados inválidos com { ok: false, error }", async () => {
      const result = await createFamily({
        name: "",
        kinship: "titular",
        splitRule: "igual",
      });

      expect(result).toMatchObject({
        ok: false,
        error: expect.any(String),
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("impede criação se o usuário já possui família ativa", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "mem_ativo" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await createFamily({
        name: "Família Nova",
        kinship: "titular",
        splitRule: "igual",
      });

      expect(result).toEqual({
        ok: false,
        error: "Você já possui uma família ativa.",
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("cria família, membro dono, categorias e redireciona para /", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      await expect(
        createFamily({
          name: "Família Silva",
          kinship: "titular",
          splitRule: "proporcional",
          inviteEmail: "conjuge@teste.com",
        })
      ).rejects.toThrow("NEXT_REDIRECT:/");

      expect(redirect).toHaveBeenCalledWith("/");
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
