import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/invites", () => ({
  hashInviteToken: vi.fn((token: string) => `hash_${token}`),
}));

import { db } from "@/db";
import { findInviteByToken, getShellData, listFamily } from "./family-queries";

describe("family-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getShellData", () => {
    it("retorna familyName e memberCount de membros ativos", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ name: "Família Lima" }]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 3 }]),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const result = await getShellData("fam_123");
      expect(result).toEqual({
        familyName: "Família Lima",
        memberCount: 3,
      });
    });

    it("lança erro se a família não for encontrada", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      await expect(getShellData("fam_inexistente")).rejects.toThrow("Família não encontrada");
    });
  });

  describe("listFamily", () => {
    it("retorna lista de membros não removidos e convites pendentes", async () => {
      const mockMembers = [
        { id: "mem_1", displayName: "Titular", status: "ativo" },
        { id: "mem_2", displayName: "Dependente", status: "convidado" },
      ];
      const mockInvites = [
        { id: "inv_1", email: "conjuge@teste.com", acceptedAt: null },
        { id: "inv_2", email: null, acceptedAt: null },
      ];

      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockMembers),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockInvites),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const result = await listFamily("fam_123");
      expect(result).toEqual({
        members: mockMembers,
        invites: mockInvites,
      });
    });
  });

  describe("findInviteByToken", () => {
    it("retorna null se o token for vazio ou inválido", async () => {
      expect(await findInviteByToken("")).toBeNull();
      expect(await findInviteByToken(null as unknown as string)).toBeNull();
    });

    it("retorna null se o convite não for encontrado, estiver expirado ou aceito", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await findInviteByToken("tok_invalido");
      expect(result).toBeNull();
    });

    it("retorna invite com email null quando for link sem email", async () => {
      const mockInviteRow = {
        invite: {
          id: "inv_link_sem_email",
          email: null,
          role: "membro",
          familyId: "fam_123",
          tokenHash: "hash_tok_link",
        },
        familyName: "Família Lima",
        invitedByName: "Jefferson",
      };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockInviteRow]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await findInviteByToken("tok_link");
      expect(result).toEqual({
        invite: mockInviteRow.invite,
        familyName: "Família Lima",
        invitedByName: "Jefferson",
      });
      expect(result?.invite.email).toBeNull();
    });

    it("retorna invite, familyName e invitedByName quando o convite for válido", async () => {
      const mockInviteRow = {
        invite: {
          id: "inv_1",
          email: "convidado@teste.com",
          role: "membro",
          familyId: "fam_123",
          tokenHash: "hash_tok_valido",
        },
        familyName: "Família Lima",
        invitedByName: "Jefferson",
      };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockInviteRow]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await findInviteByToken("tok_valido");
      expect(result).toEqual({
        invite: mockInviteRow.invite,
        familyName: "Família Lima",
        invitedByName: "Jefferson",
      });
    });
  });
});
