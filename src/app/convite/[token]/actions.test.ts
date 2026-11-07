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

vi.mock("@/lib/invites", () => ({
  hashInviteToken: vi.fn((token: string) => `hash_${token}`),
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
import { acceptInvite } from "./actions";

describe("convite actions", () => {
  const mockUser = {
    id: "usr_convidado",
    name: "Maria",
    email: "maria@exemplo.com",
  };

  const mockSession = {
    user: mockUser,
    session: { id: "sess_1" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireSession).mockResolvedValue(mockSession as unknown as Awaited<ReturnType<typeof requireSession>>);
  });

  describe("acceptInvite", () => {
    it("rejeita token vazio com erro de validação", async () => {
      const result = await acceptInvite("");
      expect(result).toMatchObject({
        ok: false,
        error: expect.any(String),
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("rejeita se o convite não for encontrado, expirado ou já aceito", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await acceptInvite("tok_invalido");
      expect(result).toEqual({
        ok: false,
        error: "Este convite expirou ou já foi usado. Peça um novo link para quem convidou você.",
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("rejeita se o email da sessão for diferente do email do convite", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "inv_1",
                email: "outro_email@exemplo.com",
                familyId: "fam_1",
                role: "membro",
                kinship: "conjuge",
                participatesInSplit: true,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await acceptInvite("tok_valido");
      expect(result).toEqual({
        ok: false,
        error: "Este convite foi enviado para outro endereço de email. Faça login com o email correspondente.",
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("aceita o convite com sucesso via joinFamilyFromInvite e redireciona para /", async () => {
      const mockInvite = {
        id: "inv_1",
        email: mockUser.email,
        familyId: "fam_1",
        role: "membro" as const,
        kinship: "conjuge" as const,
        participatesInSplit: true,
      };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockInvite]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      await expect(acceptInvite("tok_valido")).rejects.toThrow("NEXT_REDIRECT:/");

      expect(redirect).toHaveBeenCalledWith("/");
      expect(db.transaction).toHaveBeenCalled();
      expect(joinFamilyFromInvite).toHaveBeenCalledWith(expect.anything(), mockUser, mockInvite);
    });
  });
});
